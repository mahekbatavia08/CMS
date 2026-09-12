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
  Mail,
  Globe,
} from "lucide-react";

import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
} from "react-icons/fa";

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
        <div className="grid gap-6 md:grid-cols-2">

          <div className="space-y-2">
            <Label>Phone</Label>

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
            <div className="flex items-center justify-between">
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
            <Label>Email</Label>

            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <Input
                type="email"
                className="pl-10"
                placeholder="contact@example.com"
                {...register("contact.email", {
                  validate: (value) =>
                    !value ||
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ||
                    "Please enter a valid email address",
                })}
              />
            </div>
            {errors.contact?.email && (
              <p className="text-xs text-red-500 font-medium mt-1">
                {errors.contact.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Website</Label>

            <div className="relative">
              <Globe
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <Input
                className="pl-10"
                placeholder="https://example.com"
                {...register("contact.website", {
                  validate: (value) =>
                    !value || urlPattern.value.test(value) || urlPattern.message,
                })}
              />
            </div>
            {errors.contact?.website && (
              <p className="text-xs text-red-500 font-medium mt-1">
                {errors.contact.website.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Facebook</Label>

            <div className="relative">
              <FaFacebook
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600"
              />

              <Input
                className="pl-10"
                placeholder="https://facebook.com/yourpage"
                {...register("contact.facebook", { pattern: urlPattern })}
              />
            </div>
            {errors.contact?.facebook && (
              <p className="text-xs text-red-500 font-medium mt-1">
                {errors.contact.facebook.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Instagram</Label>

            <div className="relative">
              <FaInstagram
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-600"
              />

              <Input
                className="pl-10"
                placeholder="https://instagram.com/yourpage"
                {...register("contact.instagram", { pattern: urlPattern })}
              />
            </div>
            {errors.contact?.instagram && (
              <p className="text-xs text-red-500 font-medium mt-1">
                {errors.contact.instagram.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>LinkedIn</Label>

            <div className="relative">
              <FaLinkedin
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-700"
              />

              <Input
                className="pl-10"
                placeholder="https://linkedin.com/company/yourcompany"
                {...register("contact.linkedin", { pattern: urlPattern })}
              />
            </div>
            {errors.contact?.linkedin && (
              <p className="text-xs text-red-500 font-medium mt-1">
                {errors.contact.linkedin.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>YouTube</Label>

            <div className="relative">
              <FaYoutube
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-red-600"
              />

              <Input
                className="pl-10"
                placeholder="https://youtube.com/@yourchannel"
                {...register("contact.youtube", { pattern: urlPattern })}
              />
            </div>
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