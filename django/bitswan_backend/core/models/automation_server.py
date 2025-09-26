from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
import secrets
import uuid


class AutomationServer(models.Model):
    id = models.AutoField(primary_key=True)
    automation_server_id = models.CharField(
        max_length=255,
        null=False,
        blank=False,
        unique=True,
    )
    name = models.CharField(max_length=255)
    keycloak_org_id = models.CharField(max_length=255, null=False, blank=False)
    
    # New OTP and token fields
    otp = models.CharField(max_length=8, null=True, blank=True, unique=True)
    otp_expires_at = models.DateTimeField(null=True, blank=True)
    access_token = models.TextField(null=True, blank=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    
    def generate_otp(self):
        """Generate a new OTP for this automation server"""
        from django.utils import timezone
        from datetime import timedelta
        
        # Generate 8-character alphanumeric OTP
        self.otp = secrets.token_urlsafe(6).upper()[:8]
        # OTP expires in 10 minutes
        self.otp_expires_at = timezone.now() + timedelta(minutes=10)
        self.save()
        return self.otp
    
    def is_otp_valid(self, otp):
        """Check if the provided OTP is valid and not expired"""
        from django.utils import timezone
        
        if not self.otp or not otp:
            return False
        
        if self.otp != otp.upper():
            return False
            
        if self.otp_expires_at and timezone.now() > self.otp_expires_at:
            return False
            
        return True
    
    def generate_access_token(self):
        """Generate a new access token for this automation server"""
        from django.utils import timezone
        from datetime import timedelta
        
        # Generate a secure token
        self.access_token = secrets.token_urlsafe(32)
        # Token expires in 1 year
        self.token_expires_at = timezone.now() + timedelta(days=365)
        self.save()
        return self.access_token
    
    def is_token_valid(self, token):
        """Check if the provided token is valid and not expired"""
        from django.utils import timezone
        
        if not self.access_token or not token:
            return False
        
        if self.access_token != token:
            return False
            
        if self.token_expires_at and timezone.now() > self.token_expires_at:
            return False
            
        return True


class AutomationServerGroupMembership(models.Model):
    id = models.AutoField(primary_key=True)
    automation_server = models.ForeignKey(
        "AutomationServer",
        on_delete=models.CASCADE,
        related_name="group_memberships",
        null=False,
        blank=False,
    )
    keycloak_group_id = models.CharField(max_length=255)


# Signal handlers for MQTT publishing
@receiver([post_save, post_delete], sender=AutomationServerGroupMembership)
def publish_automation_server_groups_on_change(sender, instance, **kwargs):
    """
    Automatically publish automation server groups to MQTT when memberships change
    """
    try:
        from bitswan_backend.core.mqtt import MQTTService

        MQTTService().publish_automation_server_groups(instance.automation_server)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to publish automation server groups to MQTT: {e}")
