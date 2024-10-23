from bitswan_backend.brokers.models import GroupNavigation


class GroupNavigationService:
    def get_or_create_navigation(self, group_id):
        try:
            navigation = GroupNavigation.objects.get(group_id=group_id)
        except GroupNavigation.DoesNotExist:
            navigation = GroupNavigation.objects.create(group_id=group_id)
        return navigation

    def update_navigation(self, group_id, nav_items):
        navigation, _ = GroupNavigation.objects.get_or_create(group_id=group_id)
        navigation.nav_items = nav_items
        navigation.save()
        return navigation
