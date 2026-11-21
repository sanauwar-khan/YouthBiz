import assert from "node:assert/strict";
import { test } from "node:test";
import { AdminSeedConfigurationError, syncAdminAccount } from "../scripts/seedAdmin.js";

function createFakeAdminModel(initialAdmins = []) {
  const admins = [...initialAdmins];
  let nextId = admins.length;
  let createCount = 0;

  function attachSave(admin) {
    admin.save = async () => {
      const duplicate = admins.find((item) => item.email === admin.email && item._id !== admin._id);
      if (duplicate) {
        const error = new Error("duplicate key");
        error.code = 11000;
        throw error;
      }
      if (!admins.some((item) => item._id === admin._id)) admins.push(admin);
      return admin;
    };
    return admin;
  }

  initialAdmins.forEach(attachSave);

  return {
    admins,
    get createCount() { return createCount; },
    findOne(filter) {
      let sortOptions;
      const query = {
        select() { return query; },
        sort(options) { sortOptions = options; return query; },
        then(resolve, reject) {
          let matches = admins.filter((admin) => !filter.email || admin.email === filter.email);
          if (sortOptions?.createdAt === 1) {
            matches.sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
          }
          return Promise.resolve(matches[0] || null).then(resolve, reject);
        },
      };
      return query;
    },
    async create(data) {
      createCount += 1;
      if (admins.some((admin) => admin.email === data.email)) {
        const error = new Error("duplicate key");
        error.code = 11000;
        throw error;
      }
      const admin = attachSave({ ...data, _id: `admin-${++nextId}`, createdAt: new Date() });
      admins.push(admin);
      return admin;
    },
  };
}

const hashPassword = async (password, rounds) => `bcrypt-${rounds}-${password}`;

test("seeding repeatedly reuses the configured Admin and never stores the plain password", async () => {
  const AdminModel = createFakeAdminModel();
  const credentials = { email: "  ADMIN@youthbiz.example ", password: "stable-admin-password" };

  const first = await syncAdminAccount({ ...credentials, AdminModel, hashPassword });
  const originalId = AdminModel.admins[0]._id;
  const second = await syncAdminAccount({ ...credentials, AdminModel, hashPassword });

  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(AdminModel.createCount, 1);
  assert.equal(AdminModel.admins.length, 1);
  assert.equal(AdminModel.admins[0]._id, originalId);
  assert.equal(AdminModel.admins[0].email, "admin@youthbiz.example");
  assert.equal(AdminModel.admins[0].passwordHash, "bcrypt-12-stable-admin-password");
  assert.notEqual(AdminModel.admins[0].passwordHash, credentials.password);
  assert.equal(AdminModel.admins[0].isActive, true);
});

test("seeding updates an existing Admin in place when configured credentials change", async () => {
  const existing = {
    _id: "existing-admin",
    email: "old-admin@youthbiz.example",
    passwordHash: "old-hash",
    isActive: false,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
  };
  const AdminModel = createFakeAdminModel([existing]);

  const result = await syncAdminAccount({
    email: "new-admin@youthbiz.example",
    password: "new-stable-admin-password",
    AdminModel,
    hashPassword,
  });

  assert.equal(result.created, false);
  assert.equal(AdminModel.createCount, 0);
  assert.equal(AdminModel.admins.length, 1);
  assert.equal(AdminModel.admins[0]._id, "existing-admin");
  assert.equal(AdminModel.admins[0].email, "new-admin@youthbiz.example");
  assert.equal(AdminModel.admins[0].passwordHash, "bcrypt-12-new-stable-admin-password");
  assert.equal(AdminModel.admins[0].isActive, true);
});

test("concurrent first-run seed attempts create only one configured Admin", async () => {
  const AdminModel = createFakeAdminModel();
  const credentials = {
    email: "admin@youthbiz.example",
    password: "stable-admin-password",
    AdminModel,
    hashPassword,
  };

  const results = await Promise.all([
    syncAdminAccount(credentials),
    syncAdminAccount(credentials),
  ]);

  assert.equal(results.filter((result) => result.created).length, 1);
  assert.equal(AdminModel.createCount, 2);
  assert.equal(AdminModel.admins.length, 1);
  assert.equal(AdminModel.admins[0].email, "admin@youthbiz.example");
});

test("seed validation rejects weak passwords without touching Admin records", async () => {
  const AdminModel = createFakeAdminModel();
  await assert.rejects(
    syncAdminAccount({ email: "admin@youthbiz.example", password: "short", AdminModel, hashPassword }),
    AdminSeedConfigurationError,
  );
  assert.equal(AdminModel.createCount, 0);
  assert.equal(AdminModel.admins.length, 0);
});
