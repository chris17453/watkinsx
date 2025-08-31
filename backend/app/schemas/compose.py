from pydantic import BaseModel
from typing import List, Optional

class ComposeMessage(BaseModel):
    to: List[str]
    cc: Optional[List[str]] = None
    bcc: Optional[List[str]] = None
    subject: str
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    
class MessageAction(BaseModel):
    message_id: str
    folder: str
    
class MoveMessage(MessageAction):
    to_folder: str
    
class EmailSearch(BaseModel):
    query: str
    folder: Optional[str] = "INBOX"
    from_date: Optional[str] = None
    to_date: Optional[str] = None
    from_address: Optional[str] = None
    subject: Optional[str] = None