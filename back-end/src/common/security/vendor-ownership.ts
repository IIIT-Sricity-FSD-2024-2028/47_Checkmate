/**
 * VENDOR OWNERSHIP — a vendor may only change THEIR OWN packages, resources and
 * staff. Admins and superusers are not limited (they manage the whole platform).
 *
 *   assertVendorOwns(data, user, row, 'package')  -> 403 if the row belongs to another vendor
 *   stampOwnVendor(data, user, dto)                -> a vendor's new row always gets their vendorId
 *
 * Which vendor a user is: the `vendors` row whose userId is the signed-in user.
 */
import { ForbiddenException } from '@nestjs/common';

type Caller = { id?: string; role?: string } | undefined;
// Works with the real DataService (async) and with the tests' in-memory fakes
type DataLike = { collection: (name: any) => any[] | Promise<any[]> };

const isVendor = (user: Caller) => String(user?.role || '').toLowerCase() === 'vendor';

/** The vendor id of the signed-in vendor (undefined for other roles / no vendor row). */
export async function vendorIdOf(data: DataLike, user: Caller): Promise<string | undefined> {
  return (await data.collection('vendors')).find((v: any) => v.userId === user?.id)?.id;
}

/** 403 when a vendor touches a row of another vendor, or tries to move it to another vendor. */
export async function assertVendorOwns(data: DataLike, user: Caller, row: { vendorId?: string } | undefined, what: string, newVendorId?: string) {
  if (!isVendor(user)) return;
  const own = await vendorIdOf(data, user);
  if (!own) throw new ForbiddenException('Your account is not linked to a vendor.');
  if (row?.vendorId && row.vendorId !== own) throw new ForbiddenException(`You can only change your own ${what}.`);
  if (newVendorId && newVendorId !== own) throw new ForbiddenException(`You cannot give a ${what} to another vendor.`);
}

/** A vendor's new row is always theirs, whatever vendorId the request body says. */
export async function stampOwnVendor<T extends { vendorId?: string }>(data: DataLike, user: Caller, dto: T): Promise<T> {
  if (!isVendor(user)) return dto;
  const own = await vendorIdOf(data, user);
  if (!own) throw new ForbiddenException('Your account is not linked to a vendor.');
  return { ...dto, vendorId: own };
}
