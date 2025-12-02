import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SettingTabs } from '@/components/settings/SettingTabs';
import { useTitleBar } from '@/context/TitleBarProvider';
import { Settings2 } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { setTitle, setIcon, setButtons } = useTitleBar();

  useEffect(() => {
    setTitle("Settings");
    setIcon(<Settings2 size={24} />);
    setButtons(null)
  }, [setTitle, setIcon, setButtons]);

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
            <SettingTabs/>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
