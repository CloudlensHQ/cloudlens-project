"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Loader2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Building,
  User,
  Target,
} from "lucide-react";

interface OnboardingData {
  companyName: string;
  jobTitle: string;
  phoneNumber: string;
  howDidYouHear: string;
  useCase: string;
}

const steps = [
  {
    title: "Welcome to CloudLens",
    description:
      "Let&apos;s get you set up with the best cloud security experience.",
    icon: CheckCircle,
  },
  {
    title: "Company Information",
    description: "Tell us about your organization.",
    icon: Building,
  },
  {
    title: "Your Role",
    description: "Help us understand your responsibilities.",
    icon: User,
  },
  {
    title: "Your Goals",
    description: "What are you hoping to achieve with CloudLens?",
    icon: Target,
  },
];

const howDidYouHearOptions = [
  "Google Search",
  "Social Media",
  "Word of Mouth",
  "Conference/Event",
  "Blog/Article",
  "Partnership",
  "Other",
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<OnboardingData>({
    companyName: "",
    jobTitle: "",
    phoneNumber: "",
    howDidYouHear: "",
    useCase: "",
  });

  const router = useRouter();
  const { user, completeOnboarding, isAuthenticated } = useAuth();

  // Redirect if not authenticated
  if (!isAuthenticated) {
    router.push("/signin");
    return null;
  }

  // Redirect if already onboarded
  if (user?.onboardingCompleted) {
    router.push("/dashboard");
    return null;
  }

  const handleInputChange = (field: keyof OnboardingData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError("");

    try {
      await completeOnboarding(formData);
      // Redirect is handled by completeOnboarding
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to complete onboarding"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return true;
      case 1:
        return formData.companyName.trim() !== "";
      case 2:
        return formData.jobTitle.trim() !== "";
      case 3:
        return formData.useCase.trim() !== "";
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Welcome to CloudLens, {user?.firstName}!
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                We&apos;re excited to help you secure your cloud infrastructure.
                This quick setup will help us customize your experience.
              </p>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <Building className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Company Information
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Tell us about your organization so we can tailor the experience.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) =>
                    handleInputChange("companyName", e.target.value)
                  }
                  placeholder="Acme Corp"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    handleInputChange("phoneNumber", e.target.value)
                  }
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="howDidYouHear">
                  How did you hear about us?
                </Label>
                <RadioGroup
                  value={formData.howDidYouHear}
                  onValueChange={(value) =>
                    handleInputChange("howDidYouHear", value)
                  }
                >
                  {howDidYouHearOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={option} />
                      <Label htmlFor={option} className="text-sm">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Your Role
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Help us understand your role and responsibilities.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title *</Label>
                <Input
                  id="jobTitle"
                  value={formData.jobTitle}
                  onChange={(e) =>
                    handleInputChange("jobTitle", e.target.value)
                  }
                  placeholder="Security Engineer, DevOps Engineer, etc."
                  required
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <Target className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Your Goals
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                What are you hoping to achieve with CloudLens?
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="useCase">Primary Use Case *</Label>
                <Textarea
                  id="useCase"
                  value={formData.useCase}
                  onChange={(e) => handleInputChange("useCase", e.target.value)}
                  placeholder="e.g., Continuous security monitoring, compliance auditing, cost optimization, etc."
                  required
                  rows={4}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep].title}</CardTitle>
            <CardDescription>{steps[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex space-x-2">
                {currentStep < steps.length - 1 && (
                  <Button variant="ghost" onClick={handleSkip}>
                    Skip
                  </Button>
                )}

                {currentStep < steps.length - 1 ? (
                  <Button onClick={handleNext} disabled={!canProceed()}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleComplete}
                    disabled={!canProceed() || isLoading}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isLoading && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Complete Setup
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
