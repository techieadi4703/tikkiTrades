"use client";

import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import FooterLink from "@/components/forms/FooterLink";
import { signInWithEmail } from "@/lib/actions/auth.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const SignIn = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: SignInFormData) => {
    const result = await signInWithEmail(data);

    if (!result.success) {
      toast.error("Sign in failed", {
        description: result.error || "Invalid email or password",
      });
      return;
    }

    router.push("/");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.5,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome back</h1>
        <p className="text-gray-400 font-medium">Enter your credentials to access your account</p>
      </motion.div>

      <motion.form 
        variants={itemVariants}
        onSubmit={handleSubmit(onSubmit)} 
        className="space-y-5"
      >
        <motion.div variants={itemVariants}>
          <InputField
            name="email"
            label="Email"
            placeholder="contact@jsmastery.com"
            register={register}
            error={errors.email}
            validation={{
              required: "Email is required",
              pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            }}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <InputField
            name="password"
            label="Password"
            placeholder="Enter your password"
            type="password"
            register={register}
            error={errors.password}
            validation={{ required: "Password is required", minLength: 8 }}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold h-12 w-full mt-2 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
          </Button>
        </motion.div>

        <motion.div variants={itemVariants}>
          <FooterLink
            text="Don't have an account?"
            linkText="Create an account"
            href="/sign-up"
          />
        </motion.div>
      </motion.form>
    </motion.div>
  );
};

export default SignIn;

