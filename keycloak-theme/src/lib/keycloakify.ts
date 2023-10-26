import { ClassKey as OriginalClassKey } from "keycloakify/login/TemplateProps";
import { I18n } from "keycloakify/login/i18n";

import { PageProps as OriginalPageProps } from "keycloakify/login";

export type ExtendedClassKey = OriginalClassKey | "kcButtonDarkPrimaryClass";

export type ExtendedPageProps<KcContext, I18nExtended extends I18n> = Omit<
  OriginalPageProps<KcContext, I18nExtended>,
  "classes"
> & {
  classes?: Partial<Record<ExtendedClassKey, string>>;
};

export declare const useGetClassName: (params: {
  doUseDefaultCss: boolean;
  classes: Partial<Record<ExtendedClassKey, string>> | undefined;
}) => {
  getClassName: (classKey: ExtendedClassKey) => string;
};
