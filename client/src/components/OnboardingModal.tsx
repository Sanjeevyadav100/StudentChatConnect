import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserProfile, userProfileSchema, departmentOptions } from "@shared/schema";

interface OnboardingModalProps {
  onSubmit: (data: UserProfile) => void;
}

const OnboardingModal = ({ onSubmit }: OnboardingModalProps) => {
  const form = useForm<UserProfile>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      nickname: "",
      department: "",
    },
  });

  const handleSubmit = (data: UserProfile) => {
    onSubmit(data);
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-11/12 max-w-md shadow-xl">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Welcome to Campus Connect
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Chat anonymously with fellow students from your college.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nickname (optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="How should we call you?"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Department
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white">
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departmentOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center pt-2">
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
              >
                Start Chatting
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default OnboardingModal;
