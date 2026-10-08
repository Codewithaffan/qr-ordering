import Restaurant from "@/models/Restaurant";
import { serialize } from "@/utils/serialize";
import { NotFoundError, ValidationError } from "@/utils/errors";
import {
  assertPlainObject, has, requireString, requireEmail, requirePhone,
  optionalString, optionalUrl, requireNumber,
} from "@/utils/validators";

export async function getRestaurant(restaurantId) {
  const restaurant = await Restaurant.findById(restaurantId).lean();
  if (!restaurant) throw new NotFoundError("Restaurant not found");
  return serialize(restaurant);
}

/**
 * Accepts flat settings-form fields:
 * name, email, phone, address, logo, currency, taxPercentage, serviceChargePercentage
 * Only the fields that are present are updated.
 */
export async function updateRestaurant(restaurantId, body) {
  assertPlainObject(body);
  const $set = {};

  if (has(body, "name")) $set.name = requireString(body.name, "name", { max: 100 });
  if (has(body, "email")) $set.email = requireEmail(body.email);
  if (has(body, "phone")) $set.phone = requirePhone(body.phone);
  if (has(body, "address")) $set.address = optionalString(body.address, "address", { max: 300 });
  if (has(body, "logo")) $set.logo = optionalUrl(body.logo, "logo");

  if (has(body, "currency")) {
    const currency = requireString(body.currency, "currency", { min: 3, max: 3 }).toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new ValidationError("currency: must be a 3-letter code such as INR");
    }
    $set["settings.currency"] = currency;
  }
  if (has(body, "taxPercentage")) {
    $set["settings.taxPercentage"] = requireNumber(body.taxPercentage, "taxPercentage", { min: 0, max: 100, maxDecimals: 2 });
  }
  if (has(body, "serviceChargePercentage")) {
    $set["settings.serviceChargePercentage"] = requireNumber(body.serviceChargePercentage, "serviceChargePercentage", {
      min: 0, max: 100, maxDecimals: 2,
    });
  }

  const updated = await Restaurant.findByIdAndUpdate(
    restaurantId,
    { $set },
    { returnDocument: "after", runValidators: true }
  ).lean();
  if (!updated) throw new NotFoundError("Restaurant not found");
  return serialize(updated);
}

/** Only what a customer needs to see. */
export function toPublicRestaurant(r) {
  return {
    id: String(r._id),
    name: r.name,
    logo: r.logo || "",
    address: r.address || "",
    settings: {
      currency: r.settings?.currency || "INR",
      taxPercentage: r.settings?.taxPercentage || 0,
      serviceChargePercentage: r.settings?.serviceChargePercentage || 0,
    },
  };
}
