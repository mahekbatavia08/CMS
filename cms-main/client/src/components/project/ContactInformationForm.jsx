import { useFormContext } from "react-hook-form";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Phone,
  MessageCircle,
  Globe,
} from "lucide-react"

const ContactInformationForm = () => {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const phoneNumber = watch("contact.phone");

  const copyPhoneToWhatsapp = () => {
    setValue(
      "contact.whatsapp",
      phoneNumber || "",
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      }
    );
  };

  const urlPattern = {
    value: /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(:\d{1,5})?(\/.*)?$/i,
    message: "Please enter a valid URL",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid items-start gap-6 md:grid-cols-2">

          <div className="space-y-2">
            <div className="flex h-9 items-center justify-between">
              <Label>Phone</Label>
            </div>

            <div className="relative">
              <Phone
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <Input
                className="pl-10"
                placeholder="+91 9876543210"
                {...register("contact.phone", {
                  validate: (value) =>
                    !value ||
                    /^\+?[0-9\s-]{7,15}$/.test(value) ||
                    "Please enter a valid phone number",
                })}
              />
            </div>
            {errors.contact?.phone && (
              <p className="text-xs text-red-500 font-medium mt-1">
                {errors.contact.phone.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex h-9 items-center justify-between">
              <Label>WhatsApp</Label>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={copyPhoneToWhatsapp}
                disabled={!phoneNumber}
              >
                Use Phone Number
              </Button>
            </div>

            <div className="relative">
              <MessageCircle
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600"
              />

              <Input
                className="pl-10"
                placeholder="+91 9876543210"
                {...register("contact.whatsapp", {
                  validate: (value) =>
                    !value ||
                    /^\+?[0-9\s-]{7,15}$/.test(value) ||
                    "Please enter a valid WhatsApp number",
                })}
              />
            </div>
            {errors.contact?.whatsapp && (
              <p className="text-xs text-red-500 font-medium mt-1">
                {errors.contact.whatsapp.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Website Link</Label>
            <Input
              placeholder="https://..."
              {...register("contact.website", {
                pattern: urlPattern,
              })}
            />
            {errors.contact?.website && (
              <p className="text-xs text-red-500 font-medium mt-1">
                {errors.contact.website.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Instagram Link</Label>
            <Input
              placeholder="https://instagram.com/..."
              {...register("contact.instagram", {
                pattern: urlPattern,
              })}
            />
            {errors.contact?.instagram && (
              <p className="text-xs text-red-500 font-medium mt-1">
                {errors.contact.instagram.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Facebook Link</Label>
            <Input
              placeholder="https://facebook.com/..."
              {...register("contact.facebook", {
                pattern: urlPattern,
              })}
            />
            {errors.contact?.facebook && (
              <p className="text-xs text-red-500 font-medium mt-1">
                {errors.contact.facebook.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>YouTube Link</Label>
            <Input
              placeholder="https://youtube.com/..."
              {...register("contact.youtube", {
                pattern: urlPattern,
              })}
            />
            {errors.contact?.youtube && (
              <p className="text-xs text-red-500 font-medium mt-1">
                {errors.contact.youtube.message}
              </p>
            )}
          </div>

        </div>
      </CardContent>
    </Card>
  );
};

export default ContactInformationForm;