import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SettingTabs } from '@/components/settings/SettingTabs';
import { TitleBar } from '@/components/layout/TitleBar';
import { fetchOrgGroups } from '@/data/groups';
import { fetchOrgUsers } from '@/data/users';
import { UserGroupsListResponse } from '@/data/groups';
import { OrgUsersListResponse } from '@/data/users';

const SettingsPage: React.FC = () => {
  const [groupsList, setGroupsList] = useState<UserGroupsListResponse | undefined>();
  const [usersList, setUsersList] = useState<OrgUsersListResponse | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        console.log('Loading settings data...');
        const [groups, users] = await Promise.all([
          fetchOrgGroups(),
          fetchOrgUsers(1)
        ]);
        console.log('Groups loaded:', groups);
        console.log('Users loaded:', users);
        setGroupsList(groups);
        setUsersList(users);
      } catch (error) {
        console.error('Error loading settings data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex w-full flex-col gap-4">
        <h1 className="text-2xl font-bold text-stone-700 md:hidden">Settings</h1>
        <TitleBar title="Settings" />
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
      <TitleBar title="Settings" />

      <div className="hidden min-h-[100vh] flex-1 md:min-h-min lg:flex">
        <Card
          className={
            "h-full w-full rounded-md border border-slate-300 shadow-sm"
          }
        >
          <CardContent className="h-full p-3">
            <SettingTabs groupsList={groupsList} usersList={usersList} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
