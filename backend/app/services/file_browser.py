import asyncio
import paramiko
import boto3
from botocore.exceptions import ClientError
import ftplib
from typing import List, Optional
from datetime import datetime
import os
import stat
from app.models.files import FileStorage, FileStorageType
from app.schemas.files import FileItem, DirectoryListing, FileSearchResult

class FileBrowserService:
    def __init__(self, storage: FileStorage):
        self.storage = storage
        
    async def list_directory(self, path: str = None) -> DirectoryListing:
        """List files and directories in the given path"""
        if path is None:
            path = self.storage.base_path or "/"
            
        if self.storage.storage_type == FileStorageType.SFTP:
            return await self._list_sftp_directory(path)
        elif self.storage.storage_type == FileStorageType.S3:
            return await self._list_s3_directory(path)
        elif self.storage.storage_type == FileStorageType.FTP:
            return await self._list_ftp_directory(path)
        else:
            raise ValueError(f"Unsupported storage type: {self.storage.storage_type}")
    
    async def search_files(self, search_term: str, path: str = None, max_results: int = 100) -> FileSearchResult:
        """Search for files matching the given term"""
        if path is None:
            path = self.storage.base_path or "/"
            
        if self.storage.storage_type == FileStorageType.SFTP:
            return await self._search_sftp_files(search_term, path, max_results)
        elif self.storage.storage_type == FileStorageType.S3:
            return await self._search_s3_files(search_term, path, max_results)
        elif self.storage.storage_type == FileStorageType.FTP:
            return await self._search_ftp_files(search_term, path, max_results)
        else:
            raise ValueError(f"Unsupported storage type: {self.storage.storage_type}")
    
    async def download_file(self, file_path: str) -> bytes:
        """Download a file and return its contents"""
        if self.storage.storage_type == FileStorageType.SFTP:
            return await self._download_sftp_file(file_path)
        elif self.storage.storage_type == FileStorageType.S3:
            return await self._download_s3_file(file_path)
        elif self.storage.storage_type == FileStorageType.FTP:
            return await self._download_ftp_file(file_path)
        else:
            raise ValueError(f"Unsupported storage type: {self.storage.storage_type}")
    
    # SFTP Implementation
    async def _list_sftp_directory(self, path: str) -> DirectoryListing:
        def _sftp_list():
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            
            try:
                ssh.connect(
                    hostname=self.storage.host,
                    port=self.storage.port or 22,
                    username=self.storage.username,
                    password=self.storage.password
                )
                
                sftp = ssh.open_sftp()
                items = []
                
                try:
                    file_list = sftp.listdir_attr(path)
                    for item in file_list:
                        is_dir = stat.S_ISDIR(item.st_mode)
                        items.append(FileItem(
                            name=item.filename,
                            path=os.path.join(path, item.filename),
                            size=item.st_size if not is_dir else None,
                            modified=datetime.fromtimestamp(item.st_mtime) if item.st_mtime else None,
                            is_directory=is_dir,
                            permissions=oct(item.st_mode)[-3:] if item.st_mode else None
                        ))
                except Exception as e:
                    raise Exception(f"Failed to list directory: {str(e)}")
                finally:
                    sftp.close()
                    
                parent_path = os.path.dirname(path) if path != "/" else None
                total_files = sum(1 for item in items if not item.is_directory)
                total_dirs = sum(1 for item in items if item.is_directory)
                
                return DirectoryListing(
                    current_path=path,
                    parent_path=parent_path,
                    items=items,
                    total_files=total_files,
                    total_directories=total_dirs
                )
            finally:
                ssh.close()
        
        return await asyncio.get_event_loop().run_in_executor(None, _sftp_list)
    
    async def _search_sftp_files(self, search_term: str, path: str, max_results: int) -> FileSearchResult:
        def _sftp_search():
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            
            try:
                ssh.connect(
                    hostname=self.storage.host,
                    port=self.storage.port or 22,
                    username=self.storage.username,
                    password=self.storage.password
                )
                
                # Use find command for searching
                stdin, stdout, stderr = ssh.exec_command(f'find "{path}" -name "*{search_term}*" | head -{max_results}')
                results = stdout.read().decode().strip().split('\n')
                
                items = []
                for result_path in results:
                    if result_path:
                        name = os.path.basename(result_path)
                        items.append(FileItem(
                            name=name,
                            path=result_path,
                            is_directory=False  # Simplified for search
                        ))
                
                return FileSearchResult(
                    items=items,
                    search_term=search_term,
                    total_results=len(items),
                    search_path=path
                )
            finally:
                ssh.close()
        
        return await asyncio.get_event_loop().run_in_executor(None, _sftp_search)
    
    async def _download_sftp_file(self, file_path: str) -> bytes:
        def _sftp_download():
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            
            try:
                ssh.connect(
                    hostname=self.storage.host,
                    port=self.storage.port or 22,
                    username=self.storage.username,
                    password=self.storage.password
                )
                
                sftp = ssh.open_sftp()
                with sftp.file(file_path, 'rb') as f:
                    return f.read()
            finally:
                if 'sftp' in locals():
                    sftp.close()
                ssh.close()
        
        return await asyncio.get_event_loop().run_in_executor(None, _sftp_download)
    
    # S3 Implementation
    async def _list_s3_directory(self, path: str) -> DirectoryListing:
        def _s3_list():
            s3_client = boto3.client(
                's3',
                aws_access_key_id=self.storage.access_key,
                aws_secret_access_key=self.storage.secret_key,
                region_name=self.storage.region
            )
            
            prefix = path.lstrip('/') if path != '/' else ''
            if prefix and not prefix.endswith('/'):
                prefix += '/'
            
            try:
                response = s3_client.list_objects_v2(
                    Bucket=self.storage.bucket_name,
                    Prefix=prefix,
                    Delimiter='/'
                )
                
                items = []
                
                # Add directories (common prefixes)
                for prefix_info in response.get('CommonPrefixes', []):
                    dir_name = prefix_info['Prefix'].rstrip('/').split('/')[-1]
                    items.append(FileItem(
                        name=dir_name,
                        path=prefix_info['Prefix'],
                        is_directory=True
                    ))
                
                # Add files
                for obj in response.get('Contents', []):
                    if obj['Key'] != prefix:  # Skip the directory itself
                        file_name = obj['Key'].split('/')[-1]
                        if file_name:  # Skip empty names
                            items.append(FileItem(
                                name=file_name,
                                path=obj['Key'],
                                size=obj['Size'],
                                modified=obj['LastModified'],
                                is_directory=False
                            ))
                
                parent_path = '/'.join(path.rstrip('/').split('/')[:-1]) if path != '/' else None
                total_files = sum(1 for item in items if not item.is_directory)
                total_dirs = sum(1 for item in items if item.is_directory)
                
                return DirectoryListing(
                    current_path=path,
                    parent_path=parent_path,
                    items=items,
                    total_files=total_files,
                    total_directories=total_dirs
                )
            except ClientError as e:
                raise Exception(f"S3 error: {str(e)}")
        
        return await asyncio.get_event_loop().run_in_executor(None, _s3_list)
    
    async def _search_s3_files(self, search_term: str, path: str, max_results: int) -> FileSearchResult:
        def _s3_search():
            s3_client = boto3.client(
                's3',
                aws_access_key_id=self.storage.access_key,
                aws_secret_access_key=self.storage.secret_key,
                region_name=self.storage.region
            )
            
            prefix = path.lstrip('/') if path != '/' else ''
            
            try:
                paginator = s3_client.get_paginator('list_objects_v2')
                pages = paginator.paginate(Bucket=self.storage.bucket_name, Prefix=prefix)
                
                items = []
                count = 0
                
                for page in pages:
                    for obj in page.get('Contents', []):
                        if count >= max_results:
                            break
                        if search_term.lower() in obj['Key'].lower():
                            file_name = obj['Key'].split('/')[-1]
                            if file_name:
                                items.append(FileItem(
                                    name=file_name,
                                    path=obj['Key'],
                                    size=obj['Size'],
                                    modified=obj['LastModified'],
                                    is_directory=False
                                ))
                                count += 1
                    if count >= max_results:
                        break
                
                return FileSearchResult(
                    items=items,
                    search_term=search_term,
                    total_results=len(items),
                    search_path=path
                )
            except ClientError as e:
                raise Exception(f"S3 search error: {str(e)}")
        
        return await asyncio.get_event_loop().run_in_executor(None, _s3_search)
    
    async def _download_s3_file(self, file_path: str) -> bytes:
        def _s3_download():
            s3_client = boto3.client(
                's3',
                aws_access_key_id=self.storage.access_key,
                aws_secret_access_key=self.storage.secret_key,
                region_name=self.storage.region
            )
            
            try:
                response = s3_client.get_object(Bucket=self.storage.bucket_name, Key=file_path)
                return response['Body'].read()
            except ClientError as e:
                raise Exception(f"S3 download error: {str(e)}")
        
        return await asyncio.get_event_loop().run_in_executor(None, _s3_download)
    
    # FTP Implementation
    async def _list_ftp_directory(self, path: str) -> DirectoryListing:
        def _ftp_list():
            ftp = ftplib.FTP()
            
            try:
                ftp.connect(self.storage.host, self.storage.port or 21)
                ftp.login(self.storage.username, self.storage.password)
                ftp.cwd(path)
                
                items = []
                files_list = []
                ftp.dir(files_list.append)
                
                for line in files_list:
                    parts = line.split()
                    if len(parts) >= 9:
                        permissions = parts[0]
                        size = int(parts[4]) if parts[4].isdigit() else 0
                        name = ' '.join(parts[8:])
                        is_dir = permissions.startswith('d')
                        
                        items.append(FileItem(
                            name=name,
                            path=os.path.join(path, name),
                            size=size if not is_dir else None,
                            is_directory=is_dir,
                            permissions=permissions
                        ))
                
                parent_path = os.path.dirname(path) if path != "/" else None
                total_files = sum(1 for item in items if not item.is_directory)
                total_dirs = sum(1 for item in items if item.is_directory)
                
                return DirectoryListing(
                    current_path=path,
                    parent_path=parent_path,
                    items=items,
                    total_files=total_files,
                    total_directories=total_dirs
                )
            finally:
                ftp.quit()
        
        return await asyncio.get_event_loop().run_in_executor(None, _ftp_list)
    
    async def _search_ftp_files(self, search_term: str, path: str, max_results: int) -> FileSearchResult:
        # FTP search is limited - we'll do a simple recursive list and filter
        listing = await self._list_ftp_directory(path)
        filtered_items = [
            item for item in listing.items 
            if search_term.lower() in item.name.lower()
        ][:max_results]
        
        return FileSearchResult(
            items=filtered_items,
            search_term=search_term,
            total_results=len(filtered_items),
            search_path=path
        )
    
    async def _download_ftp_file(self, file_path: str) -> bytes:
        def _ftp_download():
            ftp = ftplib.FTP()
            
            try:
                ftp.connect(self.storage.host, self.storage.port or 21)
                ftp.login(self.storage.username, self.storage.password)
                
                from io import BytesIO
                bio = BytesIO()
                ftp.retrbinary(f'RETR {file_path}', bio.write)
                return bio.getvalue()
            finally:
                ftp.quit()
        
        return await asyncio.get_event_loop().run_in_executor(None, _ftp_download)

    async def test_connection(self) -> bool:
        """Test if the storage connection is working"""
        try:
            await self.list_directory()
            return True
        except Exception:
            return False