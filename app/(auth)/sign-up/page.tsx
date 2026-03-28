"use client";

import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";
import {
  INVESTMENT_GOALS,
  PREFERRED_INDUSTRIES,
  RISK_TOLERANCE_OPTIONS,
} from "@/lib/constants";
import { CountrySelectField } from "@/components/forms/CountrySelectField";
import FooterLink from "@/components/forms/FooterLink";
import { signUpWithEmail } from "@/lib/actions/auth.actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const SignUp = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: SignUpFormData) => {
    const result = await signUpWithEmail(data);

    if (!result.success) {
      toast.error("Sign up failed", {
        description: result.error || "Failed to create account",
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
      transition: { duration: 0.5 },
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
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Get Started</h1>
        <p className="text-gray-400 font-medium">Join TikkiTrades to start your investing journey</p>
      </motion.div>

      <motion.form 
        variants={itemVariants}
        onSubmit={handleSubmit(onSubmit)} 
        className="space-y-5"
      >
        <motion.div variants={itemVariants}>
          <InputField
            name="fullName"
            label="Full Name"
            placeholder="John Doe"
            register={register}
            error={errors.fullName}
            validation={{ required: "Full name is required", minLength: 2 }}
          />
        </motion.div>

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
            placeholder="Enter a strong password"
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
            {isSubmitting ? "Creating Account..." : "Start Your Journey"}
          </Button>
        </motion.div>

        <motion.div variants={itemVariants}>
          <FooterLink
            text="Already have an account?"
            linkText="Sign in"
            href="/sign-in"
          />
        </motion.div>
      </motion.form>
    </motion.div>
  );
};

export default SignUp;

