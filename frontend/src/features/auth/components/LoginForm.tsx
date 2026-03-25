import React, { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLogin } from "@/features/auth/api/authApi";
import { useAuth } from "@/features/auth/context/AuthContext";
import type { LoginDto, UserRole } from "@/types";

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login: setAuthState } = useAuth();
  const loginMutation = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    try {
      const credentials: LoginDto = { email, password };
      const response = await loginMutation.mutateAsync(credentials);

      setAuthState(
        {
          userId: response.userId,
          name: response.name,
          email: response.email,
          role: response.role as UserRole,
        },
        response.token,
      );

      const roleUpper = response.role.toUpperCase();
      switch (roleUpper) {
        case "ADMIN":
          navigate("/admin");
          break;
        case "TEACHER":
          navigate("/teacher");
          break;
        case "STUDENT":
          navigate("/student");
          break;
        default:
          navigate("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to login");
    }
  };

  return (
    <div className="w-full max-w-md flex-grow flex flex-col justify-center space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
          Welcome Back
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Log in to PMSS Portal
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-gray-700">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Email Input */}
          <Input
            id="email"
            type="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            autoComplete="email"
            required
          />

          {/* Password Input */}
          <Input
            id="password"
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <Info className="text-red-600 dark:text-red-400 w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loginMutation.isPending}
            className="w-full"
          >
            Login
          </Button>

          {/* Info Note */}
          <div className="flex items-start gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Info className="text-primary w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
              <strong>Note:</strong> Please use your university email and
              password to login.
            </p>
          </div>
        </form>
      </div>

      {/* Footer */}
      <footer className="w-full mt-auto py-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-x-6 gap-y-4 text-xs text-gray-400 font-medium">
          <span className="text-gray-500 dark:text-gray-400">© 2026 PMSS</span>
          <div className="flex gap-4">
            <a
              href="#"
              className="hover:text-primary transition underline decoration-gray-200 dark:decoration-gray-700 underline-offset-4"
            >
              Support Center
            </a>
            <a
              href="#"
              className="hover:text-primary transition underline decoration-gray-200 dark:decoration-gray-700 underline-offset-4"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="hover:text-primary transition underline decoration-gray-200 dark:decoration-gray-700 underline-offset-4"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
