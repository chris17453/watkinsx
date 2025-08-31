import asyncio
import email
import base64
from email.header import decode_header
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
import logging
import ssl
import aiosmtplib
import aioimaplib
import hashlib
import json
from app.models.models import Domain, EmailAccount
from app.schemas.schemas import EmailMessage, EmailFolder

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.message_cache: Dict[str, Dict] = {}
        self.folder_cache: Dict[str, List[EmailFolder]] = {}
        self.cache_ttl = 300  # 5 minutes
    
    def _get_cache_key(self, email_account: EmailAccount, domain: Domain, extra: str = "") -> str:
        return f"{email_account.id}_{domain.id}_{extra}"
    
    def _is_cache_valid(self, cache_entry: Dict) -> bool:
        if not cache_entry:
            return False
        return (datetime.now().timestamp() - cache_entry.get('timestamp', 0)) < self.cache_ttl
    
    async def get_imap_connection(self, domain: Domain, email_account: EmailAccount) -> aioimaplib.IMAP4_SSL:
        # Create fresh connection for each request to avoid SSL issues
        try:
            if domain.use_ssl:
                imap = aioimaplib.IMAP4_SSL(host=domain.imap_server, port=domain.imap_port)
            else:
                imap = aioimaplib.IMAP4(host=domain.imap_server, port=domain.imap_port)
            
            await imap.wait_hello_from_server()
            await imap.login(email_account.imap_username, email_account.imap_password)
            
            return imap
            
        except Exception as e:
            logger.error(f"Failed to connect to IMAP server {domain.imap_server}: {e}")
            raise Exception(f"IMAP connection failed: {str(e)}")
    
    async def get_folders(self, domain: Domain, email_account: EmailAccount) -> List[EmailFolder]:
        cache_key = self._get_cache_key(email_account, domain, "folders")
        
        # Check cache first
        if cache_key in self.folder_cache and self._is_cache_valid(self.folder_cache[cache_key]):
            return self.folder_cache[cache_key]['data']
        
        imap = None
        try:
            imap = await self.get_imap_connection(domain, email_account)
            response = await imap.list('""', '*')
            folders = []
            
            for folder_line in response.lines:
                try:
                    # Parse folder line format: '(\\flags) "separator" "folder_name"'
                    parts = folder_line.decode().split(' ')
                    if len(parts) >= 3:
                        folder_name = parts[-1].strip('"')
                        
                        # Get folder status
                        select_response = await imap.select(folder_name)
                        if select_response.result == 'OK':
                            # Get message count from SELECT response
                            message_count = 0
                            for line in select_response.lines:
                                if b'EXISTS' in line:
                                    message_count = int(line.decode().split()[0])
                                    break
                            
                            # Get unread count
                            search_response = await imap.search('UNSEEN')
                            unread_count = len(search_response.lines[0].decode().split()) if search_response.lines[0] else 0
                            
                            folders.append(EmailFolder(
                                name=folder_name,
                                display_name=folder_name.replace('_', ' ').title(),
                                message_count=message_count,
                                unread_count=unread_count
                            ))
                except Exception as e:
                    logger.warning(f"Error processing folder {folder_line}: {e}")
                    continue
            
            # Cache the result
            sorted_folders = sorted(folders, key=lambda x: x.name)
            self.folder_cache[cache_key] = {
                'data': sorted_folders,
                'timestamp': datetime.now().timestamp()
            }
            
            return sorted_folders
            
        except Exception as e:
            logger.error(f"Failed to get folders: {e}")
            raise Exception(f"Failed to get folders: {str(e)}")
        finally:
            if imap:
                try:
                    await imap.logout()
                except:
                    pass
    
    async def get_messages(self, domain: Domain, email_account: EmailAccount, 
                          folder: str = "INBOX", limit: int = 50, offset: int = 0) -> List[EmailMessage]:
        cache_key = self._get_cache_key(email_account, domain, f"messages_{folder}_{limit}_{offset}")
        
        # Check cache first
        if cache_key in self.message_cache and self._is_cache_valid(self.message_cache[cache_key]):
            return self.message_cache[cache_key]['data']
        
        imap = None
        try:
            imap = await self.get_imap_connection(domain, email_account)
            await imap.select(folder)
            search_response = await imap.search('ALL')
            
            if search_response.result != 'OK' or not search_response.lines[0]:
                return []
            
            message_ids = search_response.lines[0].decode().split()
            
            # Apply pagination
            total_messages = len(message_ids)
            start_idx = max(0, total_messages - offset - limit)
            end_idx = total_messages - offset
            
            message_ids = message_ids[start_idx:end_idx]
            message_ids.reverse()  # Show newest first
            
            messages = []
            
            # Fetch messages in batches for better performance
            batch_size = 10
            for i in range(0, len(message_ids), batch_size):
                batch = message_ids[i:i + batch_size]
                batch_messages = await self._fetch_message_batch(imap, batch, folder)
                messages.extend(batch_messages)
            
            # Cache the result
            self.message_cache[cache_key] = {
                'data': messages,
                'timestamp': datetime.now().timestamp()
            }
            
            return messages
            
        except Exception as e:
            logger.error(f"Failed to get messages from {folder}: {e}")
            raise Exception(f"Failed to get messages: {str(e)}")
        finally:
            if imap:
                try:
                    await imap.logout()
                except:
                    pass
    
    async def _fetch_message_batch(self, imap: aioimaplib.IMAP4_SSL, message_ids: List[str], folder: str) -> List[EmailMessage]:
        messages = []
        
        for msg_id in message_ids:
            try:
                # Fetch headers and flags first for efficiency
                fetch_response = await imap.fetch(msg_id, '(RFC822.HEADER FLAGS)')
                
                if fetch_response.result != 'OK':
                    continue
                
                header_data = fetch_response.lines[1]
                flags_data = fetch_response.lines[0]
                
                email_message = email.message_from_bytes(header_data)
                
                # Parse flags
                is_read = b'\\\\Seen' in flags_data
                
                # Parse headers
                subject = self._decode_header(email_message.get('Subject', ''))
                sender = self._decode_header(email_message.get('From', ''))
                recipient = [self._decode_header(email_message.get('To', ''))]
                date_str = email_message.get('Date', '')
                message_id_header = email_message.get('Message-ID', f'<{msg_id}@local>')
                in_reply_to = email_message.get('In-Reply-To', '')
                references = email_message.get('References', '')
                
                # Parse date
                try:
                    date = email.utils.parsedate_to_datetime(date_str)
                    if date.tzinfo is None:
                        date = date.replace(tzinfo=timezone.utc)
                except:
                    date = datetime.now(timezone.utc)
                
                # For message list, we don't need the full body yet
                messages.append(EmailMessage(
                    id=msg_id,
                    subject=subject,
                    sender=sender,
                    recipient=recipient,
                    date=date.isoformat(),
                    body_text=None,
                    body_html=None,
                    is_read=is_read,
                    has_attachments=False,  # Will be determined when full message is loaded
                    folder=folder,
                    thread_id=msg_id,  # Simple thread ID
                    message_id=message_id_header,
                    in_reply_to=in_reply_to,
                    references=references
                ))
                
            except Exception as e:
                logger.warning(f"Error processing message {msg_id}: {e}")
                continue
        
        return messages
    
    async def get_message_content(self, domain: Domain, email_account: EmailAccount, 
                                 message_id: str, folder: str = "INBOX") -> EmailMessage:
        imap = None
        try:
            imap = await self.get_imap_connection(domain, email_account)
            await imap.select(folder)
            
            # Fetch full message
            fetch_response = await imap.fetch(message_id, '(RFC822 FLAGS)')
            
            if fetch_response.result != 'OK':
                raise Exception(f"Message {message_id} not found")
            
            raw_email = fetch_response.lines[1]
            flags_data = fetch_response.lines[0]
            
            email_message = email.message_from_bytes(raw_email)
            
            # Mark as read
            if b'\\\\Seen' not in flags_data:
                await imap.store(message_id, '+FLAGS', '\\\\Seen')
            
            # Parse message
            subject = self._decode_header(email_message.get('Subject', ''))
            sender = self._decode_header(email_message.get('From', ''))
            recipient = [self._decode_header(addr) for addr in email_message.get('To', '').split(',')]
            cc = [self._decode_header(addr) for addr in email_message.get('Cc', '').split(',')] if email_message.get('Cc') else []
            date_str = email_message.get('Date', '')
            message_id_header = email_message.get('Message-ID', f'<{message_id}@local>')
            in_reply_to = email_message.get('In-Reply-To', '')
            references = email_message.get('References', '')
            
            # Parse date
            try:
                date = email.utils.parsedate_to_datetime(date_str)
                if date.tzinfo is None:
                    date = date.replace(tzinfo=timezone.utc)
            except:
                date = datetime.now(timezone.utc)
            
            # Extract body and attachments
            body_text, body_html, attachments = self._extract_content(email_message)
            
            message = EmailMessage(
                id=message_id,
                subject=subject,
                sender=sender,
                recipient=recipient + cc,
                date=date.isoformat(),
                body_text=body_text,
                body_html=body_html,
                is_read=True,
                has_attachments=len(attachments) > 0,
                folder=folder,
                thread_id=message_id,
                message_id=message_id_header,
                in_reply_to=in_reply_to,
                references=references
            )
            
            return message
            
        except Exception as e:
            logger.error(f"Failed to get message content {message_id}: {e}")
            raise Exception(f"Failed to get message: {str(e)}")
        finally:
            if imap:
                try:
                    await imap.logout()
                except:
                    pass
    
    async def send_message(self, domain: Domain, email_account: EmailAccount, 
                          to_addresses: List[str], subject: str, 
                          body_text: str = None, body_html: str = None,
                          cc_addresses: List[str] = None, bcc_addresses: List[str] = None,
                          attachments: List[Dict] = None) -> bool:
        smtp = None
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = email_account.email_address
            msg['To'] = ', '.join(to_addresses)
            
            if cc_addresses:
                msg['Cc'] = ', '.join(cc_addresses)
            
            # Add text and HTML parts
            if body_text:
                msg.attach(MIMEText(body_text, 'plain'))
            if body_html:
                msg.attach(MIMEText(body_html, 'html'))
            
            # Add attachments
            if attachments:
                for attachment in attachments:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(attachment['content'])
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename= {attachment["filename"]}'
                    )
                    msg.attach(part)
            
            # Send via SMTP
            if domain.use_ssl:
                smtp = aiosmtplib.SMTP(hostname=domain.smtp_server, port=domain.smtp_port, use_tls=True)
            else:
                smtp = aiosmtplib.SMTP(hostname=domain.smtp_server, port=domain.smtp_port)
            
            await smtp.connect()
            await smtp.login(email_account.imap_username, email_account.imap_password)
            
            all_recipients = to_addresses + (cc_addresses or []) + (bcc_addresses or [])
            await smtp.send_message(msg, recipients=all_recipients)
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to send message: {e}")
            raise Exception(f"Failed to send message: {str(e)}")
        finally:
            if smtp:
                try:
                    await smtp.quit()
                except:
                    pass
    
    def _decode_header(self, header: str) -> str:
        if not header:
            return ""
        
        decoded_parts = decode_header(header)
        decoded_header = ""
        
        for part, encoding in decoded_parts:
            if isinstance(part, bytes):
                if encoding:
                    decoded_header += part.decode(encoding, errors='ignore')
                else:
                    decoded_header += part.decode('utf-8', errors='ignore')
            else:
                decoded_header += part
        
        return decoded_header.strip()
    
    def _extract_content(self, email_message) -> Tuple[Optional[str], Optional[str], List[Dict]]:
        body_text = None
        body_html = None
        attachments = []
        
        if email_message.is_multipart():
            for part in email_message.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition", ""))
                
                if "attachment" in content_disposition:
                    filename = part.get_filename()
                    if filename:
                        attachments.append({
                            'filename': self._decode_header(filename),
                            'content_type': content_type,
                            'size': len(part.get_payload(decode=True) or b'')
                        })
                elif content_type == "text/plain" and not body_text:
                    body_text = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                elif content_type == "text/html" and not body_html:
                    body_html = part.get_payload(decode=True).decode('utf-8', errors='ignore')
        else:
            content_type = email_message.get_content_type()
            payload = email_message.get_payload(decode=True)
            if payload:
                content = payload.decode('utf-8', errors='ignore')
                if content_type == "text/plain":
                    body_text = content
                elif content_type == "text/html":
                    body_html = content
        
        return body_text, body_html, attachments

# Global email service instance
email_service = EmailService()