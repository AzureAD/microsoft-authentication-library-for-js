export interface FormProps {
    loading: boolean;
}

export interface InitialFormProps extends FormProps {
    onSubmit: (e: React.FormEvent) => Promise<void>;
    username: string;
    setUsername: (value: string) => void;
    password: string;
    setPassword: (value: string) => void;
}

export interface CodeFormProps extends FormProps {
    onSubmit: (e: React.FormEvent) => Promise<void>;
    code: string;
    setCode: (value: string) => void;
}

export interface PasswordFormProps extends FormProps {
    onSubmit: (e: React.FormEvent) => Promise<void>;
    password: string;
    setPassword: (value: string) => void;
}
