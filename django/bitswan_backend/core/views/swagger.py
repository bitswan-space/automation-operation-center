from django.http import HttpResponse
from django.views import View
from django.views.generic import TemplateView
from drf_spectacular.views import SpectacularSwaggerView, SpectacularAPIView
import os
from django.conf import settings
import markdown
from markdown.extensions import codehilite, fenced_code, tables, toc


class PublicSwaggerView(SpectacularSwaggerView):
    """
    Custom Swagger view that bypasses authentication entirely.
    This prevents JWT token validation errors when accessing the API documentation.
    """
    authentication_classes = []  # No authentication required
    permission_classes = []      # No permissions required


class PublicSchemaView(SpectacularAPIView):
    """
    Custom API schema view that bypasses authentication entirely.
    This prevents JWT token validation errors when accessing the API schema.
    """
    authentication_classes = []  # No authentication required
    permission_classes = []      # No permissions required


class AutomationServerDocumentationView(TemplateView):
    """
    View to serve the automation server integration documentation as HTML.
    """
    template_name = "cli_docs.html"
    authentication_classes = []
    permission_classes = []

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Read the automation server integration documentation
        # The file is now in the Django static directory
        docs_path = os.path.join(settings.BASE_DIR, "bitswan_backend", "static", "AUTOMATION_SERVER_INTEGRATION_DOCS.md")
        
        try:
            with open(docs_path, 'r', encoding='utf-8') as f:
                markdown_content = f.read()
            
            # Convert markdown to HTML using proper markdown library
            html_content = self.markdown_to_html(markdown_content)
            context['docs_content'] = html_content
        except FileNotFoundError:
            context['docs_content'] = f"<p>Documentation file not found at: {docs_path}</p>"
        except Exception as e:
            context['docs_content'] = f"<p>Error loading documentation: {str(e)}</p>"
        
        return context
    
    def markdown_to_html(self, markdown_text):
        """
        Convert markdown to HTML using the markdown library with extensions.
        """
        # Configure markdown with extensions for better formatting
        md = markdown.Markdown(
            extensions=[
                'codehilite',      # Syntax highlighting for code blocks
                'fenced_code',     # Fenced code blocks with language support
                'tables',          # Table support
                'toc',             # Table of contents
                'nl2br',           # Convert newlines to <br> tags
                'attr_list',       # Attribute lists for styling
                'def_list',        # Definition lists
                'footnotes',       # Footnotes support
            ],
            extension_configs={
                'codehilite': {
                    'css_class': 'highlight',
                    'use_pygments': False,  # We'll use CSS highlighting
                },
                'toc': {
                    'permalink': True,
                }
            }
        )
        
        # Convert markdown to HTML
        html = md.convert(markdown_text)
        
        # Add some custom styling for API endpoints
        import re
        
        # Style API endpoint headers
        html = re.sub(
            r'<h3>(\d+\.\s*[^:]+:.*?)</h3>',
            r'<div class="api-endpoint"><h3>\1</h3>',
            html
        )
        
        # Style method indicators in endpoint descriptions
        html = re.sub(
            r'<strong>Endpoint:</strong>\s*<code>([A-Z]+)\s+([^<]+)</code>',
            r'<strong>Endpoint:</strong> <span class="method \1.lower()">\1</span><code>\2</code>',
            html
        )
        
        return html
