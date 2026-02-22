import Link from "next/link";
import { ArrowRight, KeyRound, Mail } from "lucide-react";
import { Button, Card, CardContent, Input } from "@/components/ui";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hero-overlay relative hidden p-10 lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.1em] text-[var(--color-primary-soft)]">
            DANCE ACADEMY
          </p>
          <h1 className="mt-4 max-w-md text-5xl font-black leading-[1.1] text-white">
            Learn with rhythm, progress with purpose.
          </h1>
          <p className="mt-4 max-w-md text-sm text-[var(--text-2)]">
            Login to access your premium classes, progress dashboard and certificates.
          </p>
        </div>
        <p className="max-w-sm text-sm text-[var(--text-3)]">
          Encyclopedia + Academy experience inspired by Stitch layouts.
        </p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-5">
            <div>
              <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
              <p className="mt-1 text-sm text-[var(--text-2)]">Login to continue your dance path.</p>
            </div>
            <form className="space-y-4" noValidate>
              <div className="space-y-2">
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-3)]"
                >
                  Email
                </label>
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  icon={<Mail size={16} />}
                  aria-describedby="login-email-help"
                />
                <p id="login-email-help" className="text-xs text-[var(--text-3)]">
                  Use the email address associated with your account.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-3)]"
                >
                  Password
                </label>
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  icon={<KeyRound size={16} />}
                  aria-describedby="login-password-help"
                />
                <p id="login-password-help" className="text-xs text-[var(--text-3)]">
                  Password must match the one used during registration.
                </p>
              </div>

              <Button className="w-full" rightIcon={<ArrowRight size={16} />} type="submit">
                Log In
              </Button>
            </form>
            <div className="flex justify-between text-xs text-[var(--text-3)]">
              <Link href="/auth/recovery" className="hover:text-[var(--text-1)]">
                Forgot password?
              </Link>
              <Link href="/auth/register" className="hover:text-[var(--text-1)]">
                Create account
              </Link>
            </div>

            <div className="relative pt-2">
              <div className="border-t border-[var(--border-1)]" />
              <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-[var(--surface-1)] px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-3)]">
                Or continue with
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline">Google</Button>
              <Button variant="outline">Apple</Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
