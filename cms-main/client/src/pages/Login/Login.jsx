import { useState } from "react";
import { Eye, EyeOff, Loader2, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import useAuth from "@/hooks/useAuth";
import { ROUTES } from "@/constants/routes";
import { loginSchema } from "@/lib/loginSchema";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Login = () => {
    const navigate = useNavigate();
    const { login, isLoading } = useAuth();

    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (values) => {
        try {
            const response = await login(values);

            toast.success(response.message);

            navigate(ROUTES.PROJECTS_MASTER);
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                error.message ||
                "Login failed."
            );
        }
    };

    const handleDevLogin = async () => {
        try {
            const response = await login({
                email: import.meta.env.VITE_DEV_ADMIN_EMAIL,
                password: import.meta.env.VITE_DEV_ADMIN_PASSWORD,
            });

            toast.success(response.message);

            navigate(ROUTES.PROJECTS_MASTER);
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                error.message ||
                "Developer login failed."
            );
        }
    };

    return (
        <div className="flex w-full items-center justify-center px-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-2 text-center">
                    <CardTitle className="text-3xl font-bold">
                        Portfolio CMS
                    </CardTitle>

                    <CardDescription>
                        Sign in to continue to the admin dashboard.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>

                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@example.com"
                                {...register("email")}
                            />

                            {errors.email && (
                                <p className="text-sm text-red-500">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>

                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    {...register("password")}
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>

                            {errors.password && (
                                <p className="text-sm text-red-500">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing In...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </Button>

                        {import.meta.env.DEV && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                                <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-amber-700">
                                    Development Tools
                                </p>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleDevLogin}
                                    disabled={isLoading}
                                >
                                    <Wrench className="mr-2 h-4 w-4" />

                                    Login as Admin
                                </Button>
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;