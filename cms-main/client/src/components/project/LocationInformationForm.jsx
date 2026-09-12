import { useFormContext } from "react-hook-form";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  MapPin,
  Building2,
  Landmark,
  MapPinned,
  Navigation,
} from "lucide-react";

const LocationInformationForm = () => {
  const { register, formState: { errors } } = useFormContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Location Information
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="address">
            Address
          </Label>

          <div className="relative">
            <MapPin
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <Input
              id="address"
              className="pl-10"
              placeholder="Enter complete address"
              {...register("location.address")}
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">
              City
            </Label>

            <div className="relative">
              <Building2
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <Input
                id="city"
                className="pl-10"
                placeholder="Ahmedabad"
                {...register("location.city")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">
              State
            </Label>

            <div className="relative">
              <Landmark
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <Input
                id="state"
                className="pl-10"
                placeholder="Gujarat"
                {...register("location.state")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pincode">
              Pincode
            </Label>

            <div className="relative">
              <MapPinned
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <Input
                id="pincode"
                className="pl-10"
                placeholder="380001"
                {...register("location.pincode", {
                  validate: (value) =>
                    !value || /^\d{6}$/.test(value) || "Please enter a valid 6-digit pincode",
                })}
              />
            </div>
            {errors.location?.pincode && (
              <p className="text-xs text-red-500 font-medium mt-1">
                {errors.location.pincode.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="googleMaps">
              Google Maps URL
            </Label>

            <div className="relative">
              <Navigation
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <Input
                id="googleMaps"
                className="pl-10"
                placeholder="https://maps.google.com/..."
                {...register("location.googleMaps", {
                  pattern: {
                    value: /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(:\d{1,5})?(\/.*)?$/i,
                    message: "Please enter a valid Google Maps URL",
                  },
                })}
              />
            </div>
            {errors.location?.googleMaps && (
              <p className="text-xs text-red-500 font-medium mt-1">
                {errors.location.googleMaps.message}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationInformationForm;