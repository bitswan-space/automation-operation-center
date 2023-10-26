import { ClassKey as OriginalClassKey } from "keycloakify/login/TemplateProps";
import { I18n } from "keycloakify/login/i18n";

import { PageProps as OriginalPageProps } from "keycloakify/login";

import { useGetClassName as useOriginalGetClassName } from "keycloakify/login/lib/useGetClassName";

export type ExtendedClassKey = OriginalClassKey | "kcButtonDarkPrimaryClass";

export type ExtendedPageProps<KcContext, I18nExtended extends I18n> = Omit<
  OriginalPageProps<KcContext, I18nExtended>,
  "classes"
> & {
  classes?: Partial<Record<ExtendedClassKey, string>>;
};

export const useExtendedGetClassName = (params: {
  doUseDefaultCss: boolean;
  classes: Partial<Record<ExtendedClassKey, string>> | undefined;
}) => {
  const { getClassName: originalGetClassName } =
    useOriginalGetClassName(params);

  const getExtendedClassName = (classKey: ExtendedClassKey) => {
    return originalGetClassName(classKey as OriginalClassKey);
  };

  return {
    getClassName: getExtendedClassName,
  };
};
