import { useState, type FormEventHandler } from "react";
import { clsx } from "keycloakify/tools/clsx";
import { useConstCallback } from "keycloakify/tools/useConstCallback";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import { useGetClassName } from "keycloakify/login/lib/useGetClassName";
import type { KcContext } from "../kcContext";
import type { I18n } from "../i18n";
import { Input } from "../../components/ui/input";

export default function ResetPassword(props: PageProps<Extract<KcContext, { pageId: "login-reset-password.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { getClassName } = useGetClassName({
        doUseDefaultCss,
        classes
    });

    const { realm, url } = kcContext;

    const { msg, msgStr } = i18n;

    const [isSubmitButtonDisabled, setSubmitButtonDisabled] = useState(false);

    const onSubmit = useConstCallback<FormEventHandler<HTMLFormElement>>(e => {
        e.preventDefault();

        setSubmitButtonDisabled(true);

        const formElement = e.target as HTMLFormElement;

        //NOTE: Even if we login with email Keycloak expect username and password in
        //the POST request.
        formElement.querySelector("Input[name='email']")?.setAttribute("name", "username");

        formElement.submit();
    });

    return (
        <Template
            {...{ kcContext, i18n, doUseDefaultCss, classes }}

            headerNode={""}

        >
            <div className="flex justify-center gap-4 py-2 pb-6">
            <div className="font-semibold text-4xl text-neutral-950 py-2">Forgot Your Password</div>
            </div>

            <div id="kc-form">
                <div
                    id="kc-form-wrapper"

                >
                    <form id="kc-form-forgot-password" onSubmit={onSubmit} action={url.loginResetCredentialsUrl} method="post">
                            <div className={getClassName("kcFormGroupClass")}>
                                {
                                    (() => {
                                        const label = !realm.loginWithEmailAllowed
                                            ? "username"
                                            : realm.registrationEmailAsUsername
                                            ? "email"
                                            : "usernameOrEmail";

                                        const autoCompleteHelper: typeof label = label === "usernameOrEmail" ? "username" : label;

                                        return (
                                            <>
                                                <label htmlFor={autoCompleteHelper} className={getClassName("kcLabelClass")}>
                                                    {msg(label)}
                                                </label>
                                                <Input
                                                    tabIndex={1}
                                                    id={autoCompleteHelper}
                                                    className={clsx(getClassName("kcInputClass"), "text-xl")}
                                                    //NOTE: This is used by Google Chrome auto fill so we use it to tell
                                                    //the browser how to pre fill the form but before submit we put it back
                                                    //to username because it is what keycloak expects.
                                                    name={autoCompleteHelper}
                                                    defaultValue={""}
                                                    type="text"
                                                    autoFocus={true}
                                                    autoComplete="off"
                                                />
                                            </>
                                        );
                                    })()}
                            </div>

                            <div>
                                <a href={url.loginUrl} className="underline">Back to Login</a>
                            </div>

                            <div id="kc-form-buttons" className={getClassName("kcFormGroupClass")}>

                                <input
                                    tabIndex={4}
                                    className={clsx(
                                        getClassName("kcButtonClass"),
                                        getClassName("kcHeaderWrapperClass"),
                                        getClassName("kcButtonBlockClass"),
                                        getClassName("kcButtonLargeClass"),
                                        "bg-neutral-950 rounded"
                                    )}
                                    name="reset-password"
                                    id="kc-reset-password"
                                    type="submit"
                                    value={msgStr("doSubmit")}
                                    disabled={isSubmitButtonDisabled}
                                />
                            </div>
                        </form>

                </div>

            </div>
        </Template>
    );
}
