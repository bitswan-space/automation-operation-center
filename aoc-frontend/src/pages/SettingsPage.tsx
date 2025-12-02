import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SettingTabs } from '@/components/settings/SettingTabs';
import { useTitleBar } from '@/context/TitleBarProvider';
import { fetchOrgGroups } from '@/data/groups';
import { fetchOrgUsers } from '@/data/users';
import { UserGroupsListResponse, type UserGroup } from '@/data/groups';
import { OrgUsersListResponse } from '@/data/users';
import { Settings2 } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [allGroups, setAllGroups] = useState<UserGroup[]>([]);
  const [groupsPage, setGroupsPage] = useState(1);
  const [hasMoreGroups, setHasMoreGroups] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [groupsList, setGroupsList] = useState<UserGroupsListResponse | undefined>();
  const [groupPage] = useState(1);
  const [usersList, setUsersList] = useState<OrgUsersListResponse | undefined>();
  const [userPage, setUserPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const { setTitle, setIcon, setButtons } = useTitleBar();

  useEffect(() => {
    setTitle("Settings");
    setIcon(<Settings2 size={24} />);
    setButtons(null)
  }, [setTitle, setIcon, setButtons]);

  const handleUserInvited = () => {
    loadData();
  };

  const handleUserDeleted = () => {
    loadData();
  };

  const loadMoreGroups = async (): Promise<boolean> => {
    if (!hasMoreGroups || isLoadingGroups) return false;
    
    setIsLoadingGroups(true);
    try {
      const nextPage = groupsPage + 1;
      const response = await fetchOrgGroups(nextPage);
      
      if (response.status === 'success' && response.results.length > 0) {
        setAllGroups(prev => [...prev, ...response.results]);
        setGroupsPage(nextPage);
        setHasMoreGroups(!!response.next);
        return !!response.next;
      }
      return false;
    } catch (error) {
      console.error('Error loading more groups:', error);
      return false;
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const updateUserGroups = (userId: string, groupId: string, action: 'add' | 'remove') => {
    setUsersList(prevUsers => {
      if (!prevUsers) return prevUsers;
      
      return {
        ...prevUsers,
        results: prevUsers.results.map(user => {
          if (user.id === userId) {
            if (action === 'add') {
              // Find the group to add from allGroups
              const groupToAdd = allGroups.find(g => g.id === groupId);
              if (groupToAdd && !user.groups.find(g => g.id === groupId)) {
                return {
                  ...user,
                  groups: [...user.groups, groupToAdd]
                };
              }
            } else if (action === 'remove') {
              return {
                ...user,
                groups: user.groups.filter(g => g.id !== groupId)
              };
            }
          }
          return user;
        })
      };
    });
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      console.log('Loading settings data...');
      const [groups, users] = await Promise.all([
        fetchOrgGroups(groupPage),
        fetchOrgUsers(userPage)
      ]);
      console.log('Groups loaded:', groups);
      console.log('Users loaded:', users);
      
      // Initialize groups pagination state
      if (groups.status === 'success') {
        setAllGroups(groups.results);
        setGroupsPage(1);
        setHasMoreGroups(!!groups.next);
      }
      
      // Keep groupsList for backward compatibility (used in UserDetailTable)
      setGroupsList(groups);
      setUsersList(users);
    } catch (error) {
      console.error('Error loading settings data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [groupPage, userPage]);

  if (isLoading) {
    return (
      <div className="flex w-full flex-col gap-4">
        <h1 className="text-2xl font-bold text-stone-700 md:hidden">Settings</h1>
        <div className="hidden min-h-[100vh] flex-1 md:min-h-min lg:flex">
          <Card className="h-full w-full rounded-md border border-slate-300 shadow-sm">
            <CardContent className="h-full p-3">
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading settings...</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <h1 className="text-2xl font-bold text-stone-700 md:hidden">Settings</h1>

      <div className="hidden min-h-[100vh] flex-1 md:min-h-min lg:flex">
        <Card
          className={
            "h-full w-full rounded-md border border-slate-300 shadow-sm"
          }
        >
          <CardContent className="h-full p-3">
            <SettingTabs 
              setUserPage={setUserPage}
              groupsList={groupsList}
              allGroups={allGroups}
              usersList={usersList} 
              onUserGroupUpdate={updateUserGroups}
              onLoadMoreGroups={loadMoreGroups}
              hasMoreGroups={hasMoreGroups}
              onUserInvited={handleUserInvited}
              onUserDeleted={handleUserDeleted}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
