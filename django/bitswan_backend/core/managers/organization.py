import json
from bitswan_backend.core.models import GroupNavigation


class GroupNavigationService:
    def get_or_create_navigation(self, group_id):
        try:
            navigation = GroupNavigation.objects.get(group_id=group_id)
        except GroupNavigation.DoesNotExist:
            navigation = GroupNavigation.objects.create(group_id=group_id)
        return navigation

    def get_nav_items(self, group_id):
        """Get nav_items as a proper Python list, ensuring consistent data type"""
        navigation = self.get_or_create_navigation(group_id)
        nav_items = navigation.nav_items
        
        # Ensure nav_items is always a list
        if nav_items is None:
            return []
        
        # If it's already a list, return it
        if isinstance(nav_items, list):
            return nav_items
        
        # If it's a string, try to parse it as JSON
        if isinstance(nav_items, str):
            try:
                parsed = json.loads(nav_items)
                return parsed if isinstance(parsed, list) else []
            except (json.JSONDecodeError, TypeError):
                return []
        
        # For any other type, return empty list
        return []

    def update_navigation(self, group_id, nav_items):
        navigation, _ = GroupNavigation.objects.get_or_create(group_id=group_id)
        navigation.nav_items = nav_items
        navigation.save()
        return navigation
