import os
import asyncio
import httpx
from slack_sdk import WebClient
from slack_sdk.socket_mode import SocketModeClient
from slack_sdk.socket_mode.request import SocketModeRequest
from slack_sdk.socket_mode.response import SocketModeResponse
from dotenv import load_dotenv

load_dotenv()

class DIASlackBot:
    def __init__(self):
        self.slack_bot_token = os.getenv("SLACK_BOT_TOKEN")
        self.slack_app_token = os.getenv("SLACK_APP_TOKEN")
        self.api_base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
        
        if not self.slack_bot_token or not self.slack_app_token:
            raise ValueError("SLACK_BOT_TOKEN and SLACK_APP_TOKEN must be set")
        
        self.client = WebClient(token=self.slack_bot_token)
        self.socket_client = SocketModeClient(
            app_token=self.slack_app_token,
            web_client=self.client
        )
        
        self.socket_client.socket_mode_request_listeners.append(self.handle_message)
    
    async def query_api(self, question, sources=None, response_type="concise", temperature=0.7):
        """Query the DIA API"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.api_base_url}/query",
                    json={
                        "question": question,
                        "sources": sources,
                        "response_type": response_type,
                        "temperature": temperature
                    },
                    timeout=30.0
                )
                return response.json()
            except Exception as e:
                return {"error": str(e)}
    
    def handle_message(self, client: SocketModeClient, req: SocketModeRequest):
        """Handle incoming Slack messages"""
        if req.type == "events_api":
            event = req.payload["event"]
            
            # Ignore bot messages and messages without text
            if event.get("subtype") == "bot_message" or "text" not in event:
                return
            
            # Only respond to direct messages or mentions
            if event["channel_type"] == "im" or self.is_mention(event):
                asyncio.create_task(self.process_message(event))
        
        # Acknowledge the request
        response = SocketModeResponse(envelope_id=req.envelope_id)
        client.send_socket_mode_response(response)
    
    def is_mention(self, event):
        """Check if the bot is mentioned in the message"""
        bot_user_id = self.client.auth_test()["user_id"]
        return f"<@{bot_user_id}>" in event.get("text", "")
    
    async def process_message(self, event):
        """Process and respond to a message"""
        channel = event["channel"]
        text = event["text"]
        user = event["user"]
        
        # Remove mention from text if present
        bot_user_id = self.client.auth_test()["user_id"]
        text = text.replace(f"<@{bot_user_id}>", "").strip()
        
        # Handle special commands
        if text.lower() in ["help", "?"]:
            self.send_help_message(channel)
            return
        
        if text.lower() == "sources":
            await self.send_sources_message(channel)
            return
        
        # Send typing indicator
        self.client.chat_postMessage(
            channel=channel,
            text="🤔 Let me think about that..."
        )
        
        # Query the API
        result = await self.query_api(text)
        
        if "error" in result:
            self.client.chat_postMessage(
                channel=channel,
                text=f"❌ Sorry, I encountered an error: {result['error']}"
            )
            return
        
        # Format and send response
        response_text = self.format_response(result)
        
        self.client.chat_postMessage(
            channel=channel,
            text=response_text,
            unfurl_links=False,
            unfurl_media=False
        )
    
    def format_response(self, result):
        """Format the API response for Slack"""
        response_parts = []
        
        # Add the answer
        response_parts.append(f"💡 *Answer:*\n{result['answer']}")
        
        # Add sources if available
        if result.get('sources'):
            response_parts.append("\n📚 *Sources:*")
            for i, source in enumerate(result['sources'][:3], 1):  # Limit to 3 sources
                source_text = f"{i}. <{source['url']}|{source['title']}> ({source['source_type']}) - {source['confidence']:.0%} match"
                response_parts.append(source_text)
        
        # Add processing time
        if result.get('processing_time'):
            response_parts.append(f"\n⏱️ _Processed in {result['processing_time']:.2f}s_")
        
        return "\n".join(response_parts)
    
    def send_help_message(self, channel):
        """Send help message"""
        help_text = """
🤖 *Developer Intelligence Assistant*

I can help you find information from your connected data sources!

*Commands:*
• Just ask me any question naturally
• `sources` - List available data sources
• `help` - Show this help message

*Examples:*
• "How do I deploy the application?"
• "What's the API endpoint for user authentication?"
• "Show me the latest bug reports"

I search through Confluence, JIRA, Bitbucket and other connected sources to give you accurate answers with source links.
        """
        
        self.client.chat_postMessage(
            channel=channel,
            text=help_text
        )
    
    async def send_sources_message(self, channel):
        """Send available sources message"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.api_base_url}/sources")
                sources = response.json()
            
            if not sources:
                self.client.chat_postMessage(
                    channel=channel,
                    text="📚 No data sources are currently configured."
                )
                return
            
            source_lines = ["📚 *Available Data Sources:*\n"]
            for source in sources:
                status = "✅" if source['configured'] else "❌"
                source_lines.append(f"{status} *{source['display_name']}* - {source['description']}")
            
            self.client.chat_postMessage(
                channel=channel,
                text="\n".join(source_lines)
            )
            
        except Exception as e:
            self.client.chat_postMessage(
                channel=channel,
                text=f"❌ Error fetching sources: {str(e)}"
            )
    
    def start(self):
        """Start the Slack bot"""
        print("🤖 Starting Developer Intelligence Assistant Slack Bot...")
        self.socket_client.connect()

if __name__ == "__main__":
    bot = DIASlackBot()
    bot.start()