import z from 'zod/v4';

import { useAppForm } from '@/components/form';
import { useLogin } from '@/hooks/auth';
import { useLoggedInRedirect } from '@/hooks/viewer';

export type LoginFormProps = {
  className?: string;
};

const schema = z.object({
  email: z.email(),
  password: z.string().nonempty({
    message: 'This field is required',
  }),
});

export function LoginForm({ className }: LoginFormProps) {
  const { mutate: login, failureReason } = useLogin();

  useLoggedInRedirect('/account');

  const form = useAppForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onMount: schema,
      onChange: schema,
    },
    onSubmit: ({ value }) => {
      login({ ...value, next: null });
    },
  });

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();

        form.handleSubmit();
      }}
    >
      <div className="flex flex-col gap-4 max-w-md">
        {failureReason && (
          <form.Alert
            color="error"
            title="Uh oh!"
            description={failureReason.message}
          />
        )}

        <form.AppField
          name="email"
          children={(field) => (
            <field.Text
              isRequired
              label="Email"
              placeholder="Enter your email"
              type="email"
              field={field}
            />
          )}
        />

        <form.AppField
          name="password"
          children={(field) => (
            <field.Password
              isRequired
              label="Password"
              placeholder="Enter your password"
              field={field}
            />
          )}
        />

        <form.AppForm>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => {
              return (
                <form.Footer>
                  <form.SubmitButton
                    className="w-full"
                    isDisabled={Boolean(!canSubmit || isSubmitting)}
                  >
                    Log in
                  </form.SubmitButton>
                </form.Footer>
              );
            }}
          />
        </form.AppForm>
      </div>
    </form>
  );
}
