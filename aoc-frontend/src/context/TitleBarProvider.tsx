import {
    createContext,
    ReactNode,
    useContext,
    useState,
} from "react";

interface TitleBarContextType {
    title: string;
    setTitle: (title: string) => void;
    icon: ReactNode | null;
    setIcon: (icon: ReactNode | null) => void;
    buttons: ReactNode | null;
    setButtons: (buttons: ReactNode | null) => void;
}

const TitleBarContext = createContext<TitleBarContextType | undefined>(undefined);

export const useTitleBar = () => {
    const context = useContext(TitleBarContext);
    if (context === undefined) {
        throw new Error("useTitleBar must be used within an TitleBarProvider");
    }
    return context;
};

export const TitleBarProvider = ({ children }: { children: ReactNode }) => {
    const [title, setTitle] = useState<string>("");
    const [icon, setIcon] = useState<ReactNode | null>(null);
    const [buttons, setButtons] = useState<ReactNode>(null);

    return (
        <TitleBarContext.Provider value={{ title, setTitle, icon, setIcon, buttons, setButtons }}>
            {children}
        </TitleBarContext.Provider>
    );
};
