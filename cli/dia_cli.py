#!/usr/bin/env python3
"""
Developer Intelligence Assistant CLI
"""

import click
import httpx
import json
from rich.console import Console
from rich.markdown import Markdown
from rich.table import Table
from rich.panel import Panel
from rich.prompt import Prompt, Confirm
import asyncio
import os

console = Console()

class DIAClient:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.token = None
        self.load_token()
    
    def load_token(self):
        """Load token from file"""
        try:
            with open(os.path.expanduser("~/.dia_token"), "r") as f:
                self.token = f.read().strip()
        except FileNotFoundError:
            pass
    
    def save_token(self, token):
        """Save token to file"""
        with open(os.path.expanduser("~/.dia_token"), "w") as f:
            f.write(token)
        self.token = token
    
    def get_headers(self):
        """Get headers with authentication"""
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers
    
    async def login(self, username, password):
        """Login and get token"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/auth/login",
                json={"username": username, "password": password}
            )
            if response.status_code == 200:
                data = response.json()
                self.save_token(data["access_token"])
                return True
            return False
    
    async def register(self, username, email, password, full_name=None):
        """Register new user"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/auth/register",
                json={
                    "username": username,
                    "email": email,
                    "password": password,
                    "full_name": full_name
                }
            )
            return response.status_code == 200
    
    async def query(self, question, sources=None, response_type="concise", temperature=0.7):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/query",
                json={
                    "question": question,
                    "sources": sources,
                    "response_type": response_type,
                    "temperature": temperature
                },
                headers=self.get_headers()
            )
            return response.json()
    
    async def get_sources(self):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/data-sources",
                headers=self.get_headers()
            )
            return response.json()
    
    async def sync_source(self, source_id):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/data-sources/{source_id}/sync",
                headers=self.get_headers()
            )
            return response.json()

@click.group()
@click.option('--url', default='http://localhost:8000', help='API base URL')
@click.pass_context
def cli(ctx, url):
    """Developer Intelligence Assistant CLI"""
    ctx.ensure_object(dict)
    ctx.obj['client'] = DIAClient(url)

@cli.command()
@click.option('--username', prompt=True, help='Username or email')
@click.option('--password', prompt=True, hide_input=True, help='Password')
@click.pass_context
def login(ctx, username, password):
    """Login to the system"""
    client = ctx.obj['client']
    
    async def _login():
        success = await client.login(username, password)
        if success:
            console.print("[green]✅ Login successful![/green]")
        else:
            console.print("[red]❌ Login failed. Check your credentials.[/red]")
    
    asyncio.run(_login())

@cli.command()
@click.option('--username', prompt=True, help='Username')
@click.option('--email', prompt=True, help='Email address')
@click.option('--password', prompt=True, hide_input=True, help='Password')
@click.option('--full-name', help='Full name (optional)')
@click.pass_context
def register(ctx, username, email, password, full_name):
    """Register a new account"""
    client = ctx.obj['client']
    
    async def _register():
        success = await client.register(username, email, password, full_name)
        if success:
            console.print("[green]✅ Registration successful! Please login.[/green]")
        else:
            console.print("[red]❌ Registration failed.[/red]")
    
    asyncio.run(_register())

@cli.command()
@click.argument('question')
@click.option('--sources', '-s', multiple=True, help='Specific source IDs to search')
@click.option('--type', '-t', type=click.Choice(['brief', 'concise', 'expansive']), 
              default='concise', help='Response type')
@click.option('--temperature', default=0.7, type=float, help='Creativity level (0.0-1.0)')
@click.pass_context
def ask(ctx, question, sources, type, temperature):
    """Ask a question to the knowledge base"""
    client = ctx.obj['client']
    
    if not client.token:
        console.print("[red]❌ Please login first using 'dia login'[/red]")
        return
    
    async def _ask():
        try:
            with console.status("[bold green]Thinking..."):
                result = await client.query(
                    question=question,
                    sources=list(sources) if sources else None,
                    response_type=type,
                    temperature=temperature
                )
            
            # Display answer
            console.print(Panel(
                Markdown(result['answer']),
                title="Answer",
                border_style="blue"
            ))
            
            # Display sources
            if result.get('sources'):
                console.print("\n[bold]Sources:[/bold]")
                table = Table(show_header=True, header_style="bold magenta")
                table.add_column("Title", style="cyan")
                table.add_column("Source", style="green")
                table.add_column("Confidence", style="yellow")
                table.add_column("URL", style="blue")
                
                for source in result['sources']:
                    table.add_row(
                        source['title'][:50] + "..." if len(source['title']) > 50 else source['title'],
                        source['source_type'],
                        f"{source['confidence']:.1%}",
                        source['url'][:50] + "..." if len(source['url']) > 50 else source['url']
                    )
                
                console.print(table)
            
            console.print(f"\n[dim]Processed in {result.get('processing_time', 0):.2f}s[/dim]")
            
        except Exception as e:
            console.print(f"[red]Error: {e}[/red]")
    
    asyncio.run(_ask())

@cli.command()
@click.pass_context
def sources(ctx):
    """List available data sources"""
    client = ctx.obj['client']
    
    if not client.token:
        console.print("[red]❌ Please login first using 'dia login'[/red]")
        return
    
    async def _sources():
        try:
            sources = await client.get_sources()
            
            table = Table(show_header=True, header_style="bold magenta")
            table.add_column("ID", style="cyan")
            table.add_column("Display Name", style="green")
            table.add_column("Type", style="blue")
            table.add_column("Status", style="yellow")
            table.add_column("Documents", style="magenta")
            
            for source in sources:
                status = "✅ Active" if source['is_active'] else "❌ Inactive"
                table.add_row(
                    str(source['id']),
                    source['display_name'],
                    source['source_type'].title(),
                    status,
                    str(source['document_count'])
                )
            
            console.print(table)
            
        except Exception as e:
            console.print(f"[red]Error: {e}[/red]")
    
    asyncio.run(_sources())

@cli.command()
@click.argument('source_id', type=int)
@click.pass_context
def sync(ctx, source_id):
    """Sync data from a specific source"""
    client = ctx.obj['client']
    
    if not client.token:
        console.print("[red]❌ Please login first using 'dia login'[/red]")
        return
    
    async def _sync():
        try:
            with console.status(f"[bold green]Syncing source {source_id}..."):
                result = await client.sync_source(source_id)
            
            console.print(f"[green]✅ {result['message']}[/green]")
            
        except Exception as e:
            console.print(f"[red]Error: {e}[/red]")
    
    asyncio.run(_sync())

@cli.command()
@click.pass_context
def interactive(ctx):
    """Start interactive chat mode"""
    client = ctx.obj['client']
    
    console.print(Panel(
        "[bold blue]Developer Intelligence Assistant[/bold blue]\n"
        "Interactive mode - Type 'quit' to exit, 'help' for commands",
        title="Welcome",
        border_style="blue"
    ))
    
    async def _interactive():
        while True:
            try:
                question = Prompt.ask("\n[bold cyan]Ask me anything")
                
                if question.lower() in ['quit', 'exit', 'q']:
                    console.print("[yellow]Goodbye![/yellow]")
                    break
                
                if question.lower() == 'help':
                    console.print("""
[bold]Available commands:[/bold]
• Type any question to get an answer
• 'sources' - List available sources  
• 'quit' or 'exit' - Exit interactive mode
                    """)
                    continue
                
                if question.lower() == 'sources':
                    sources = await client.get_sources()
                    for source in sources:
                        status = "✅" if source['configured'] else "❌"
                        console.print(f"{status} {source['display_name']} - {source['description']}")
                    continue
                
                with console.status("[bold green]Thinking..."):
                    result = await client.query(question=question)
                
                console.print(Panel(
                    Markdown(result['answer']),
                    title="Answer",
                    border_style="green"
                ))
                
                if result.get('sources'):
                    console.print(f"\n[dim]Sources: {', '.join([s['title'][:30] + '...' if len(s['title']) > 30 else s['title'] for s in result['sources'][:3]])}[/dim]")
                
            except KeyboardInterrupt:
                console.print("\n[yellow]Goodbye![/yellow]")
                break
            except Exception as e:
                console.print(f"[red]Error: {e}[/red]")
    
    asyncio.run(_interactive())

if __name__ == '__main__':
    cli()