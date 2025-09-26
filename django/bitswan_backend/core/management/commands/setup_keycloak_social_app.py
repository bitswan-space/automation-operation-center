import os
from django.core.management.base import BaseCommand
from allauth.socialaccount.models import SocialApp
from django.contrib.sites.models import Site


class Command(BaseCommand):
    help = 'Create or update the Keycloak social app for OAuth integration'

    def add_arguments(self, parser):
        parser.add_argument(
            '--client-id',
            default='bitswan-backend',
            help='Keycloak client ID (default: bitswan-backend)'
        )
        parser.add_argument(
            '--client-secret',
            help='Keycloak client secret (required)'
        )
        parser.add_argument(
            '--server-url',
            help='Keycloak server URL (required)'
        )
        parser.add_argument(
            '--realm',
            default='master',
            help='Keycloak realm name (default: master)'
        )

    def handle(self, *args, **options):
        client_id = options['client_id']
        client_secret = options['client_secret']
        server_url = options['server_url']
        realm = options['realm']

        if not client_secret:
            self.stdout.write(
                self.style.ERROR('Error: --client-secret is required')
            )
            return

        if not server_url:
            self.stdout.write(
                self.style.ERROR('Error: --server-url is required')
            )
            return

        try:
            # Get the current site
            site = Site.objects.get_current()

            # Create or update the social app
            app, created = SocialApp.objects.get_or_create(
                provider='openid_connect',
                provider_id='keycloak',
                name='Keycloak',
                defaults={
                    'client_id': client_id,
                    'secret': client_secret,
                    'settings': {
                        'server_url': f'{server_url}/realms/{realm}',
                        'realm': realm,
                    }
                }
            )

            # Update the app if it already exists
            if not created:
                app.client_id = client_id
                app.secret = client_secret
                app.settings = {
                    'server_url': f'{server_url}/realms/{realm}',
                    'realm': realm,
                }
                app.save()

            # Add the app to the current site
            app.sites.add(site)
            app.save()

            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created Django social app: {app.name}')
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(f'Updated Django social app: {app.name}')
                )

            self.stdout.write(f'Provider: {app.provider}')
            self.stdout.write(f'Provider ID: {app.provider_id}')
            self.stdout.write(f'Client ID: {app.client_id}')
            self.stdout.write(f'Settings: {app.settings}')

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating Django social app: {e}')
            )
            raise
