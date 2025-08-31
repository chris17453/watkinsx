import asyncio
import email
from email.header import decode_header
from typing import List, Dict, Any, Optional
from datetime import datetime
import aioimaplib
from app.models.models import Domain, EmailAccount
from app.schemas.schemas import EmailMessage, EmailFolder

class IMAPService:
    def __init__(self):
        self.connections: Dict[str, aioimaplib.IMAP4_SSL] = {}
    
    async def get_connection(self, domain: Domain, email_account: EmailAccount) -> aioimaplib.IMAP4_SSL:
        connection_key = f"{email_account.id}_{domain.id}"
        
        if connection_key not in self.connections:
            imap = aioimaplib.IMAP4_SSL(host=domain.imap_server, port=domain.imap_port)
            await imap.wait_hello_from_server()
            await imap.login(email_account.imap_username, email_account.imap_password)
            self.connections[connection_key] = imap
        
        return self.connections[connection_key]
    
    async def get_folders(self, domain: Domain, email_account: EmailAccount) -> List[EmailFolder]:
        imap = await self.get_connection(domain, email_account)
        
        response = await imap.list()
        folders = []
        
        for folder_line in response.lines:
            parts = folder_line.decode().split(' "/" ')
            if len(parts) >= 2:
                folder_name = parts[-1].strip('"')
                
                # Get folder status
                await imap.select(folder_name)
                status_response = await imap.status(folder_name, '(MESSAGES UNSEEN)')
                
                message_count = 0
                unread_count = 0
                
                if status_response.result == 'OK':
                    status_line = status_response.lines[0].decode()
                    if 'MESSAGES' in status_line and 'UNSEEN' in status_line:
                        parts = status_line.split()
                        for i, part in enumerate(parts):
                            if part == 'MESSAGES' and i + 1 < len(parts):
                                message_count = int(parts[i + 1])
                            elif part == 'UNSEEN' and i + 1 < len(parts):
                                unread_count = int(parts[i + 1])
                
                folders.append(EmailFolder(
                    name=folder_name,
                    display_name=folder_name.replace('_', ' ').title(),
                    message_count=message_count,
                    unread_count=unread_count
                ))
        
        return folders
    
    async def get_messages(self, domain: Domain, email_account: EmailAccount, 
                          folder: str = "INBOX", limit: int = 50) -> List[EmailMessage]:
        imap = await self.get_connection(domain, email_account)
        
        await imap.select(folder)
        search_response = await imap.search('ALL')
        
        if search_response.result != 'OK':
            return []
        
        message_ids = search_response.lines[0].decode().split()
        message_ids = message_ids[-limit:]  # Get latest messages
        
        messages = []
        
        for msg_id in reversed(message_ids):  # Reverse to show newest first
            fetch_response = await imap.fetch(msg_id, '(RFC822)')
            
            if fetch_response.result == 'OK':
                raw_email = fetch_response.lines[1]
                email_message = email.message_from_bytes(raw_email)
                
                # Parse email headers
                subject = self._decode_header(email_message.get('Subject', ''))
                sender = self._decode_header(email_message.get('From', ''))
                recipient = [self._decode_header(email_message.get('To', ''))]
                date_str = email_message.get('Date', '')
                
                # Parse date
                try:
                    date = datetime.strptime(date_str.split(' (')[0], '%a, %d %b %Y %H:%M:%S %z')
                except:
                    date = datetime.now()
                
                # Get message body
                body_text, body_html = self._extract_body(email_message)
                
                # Check if read (simplified - would need to track read status)
                flags_response = await imap.fetch(msg_id, '(FLAGS)')
                is_read = b'\\Seen' in flags_response.lines[0] if flags_response.result == 'OK' else False
                
                messages.append(EmailMessage(
                    id=msg_id,
                    subject=subject,
                    sender=sender,
                    recipient=recipient,
                    date=date,
                    body_text=body_text,
                    body_html=body_html,
                    is_read=is_read,
                    has_attachments=self._has_attachments(email_message),
                    folder=folder
                ))
        
        return messages
    
    def _decode_header(self, header: str) -> str:
        if not header:
            return ""
        
        decoded_parts = decode_header(header)
        decoded_header = ""
        
        for part, encoding in decoded_parts:
            if isinstance(part, bytes):
                if encoding:
                    decoded_header += part.decode(encoding)
                else:
                    decoded_header += part.decode('utf-8', errors='ignore')
            else:
                decoded_header += part
        
        return decoded_header
    
    def _extract_body(self, email_message) -> tuple[Optional[str], Optional[str]]:
        body_text = None
        body_html = None
        
        if email_message.is_multipart():
            for part in email_message.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition", ""))
                
                if "attachment" not in content_disposition:
                    if content_type == "text/plain":
                        body_text = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    elif content_type == "text/html":
                        body_html = part.get_payload(decode=True).decode('utf-8', errors='ignore')
        else:
            content_type = email_message.get_content_type()
            if content_type == "text/plain":
                body_text = email_message.get_payload(decode=True).decode('utf-8', errors='ignore')
            elif content_type == "text/html":
                body_html = email_message.get_payload(decode=True).decode('utf-8', errors='ignore')
        
        return body_text, body_html
    
    def _has_attachments(self, email_message) -> bool:
        if email_message.is_multipart():
            for part in email_message.walk():
                content_disposition = str(part.get("Content-Disposition", ""))
                if "attachment" in content_disposition:
                    return True
        return False
    
    async def close_connection(self, email_account_id: int, domain_id: int):
        connection_key = f"{email_account_id}_{domain_id}"
        if connection_key in self.connections:
            await self.connections[connection_key].logout()
            del self.connections[connection_key]

imap_service = IMAPService()