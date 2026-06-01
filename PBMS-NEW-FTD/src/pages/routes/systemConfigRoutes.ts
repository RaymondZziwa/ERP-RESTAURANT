export const SystemConfigRoutes = [
    // { name: "Permissions", path: "/settings/roles/permissions", requiredPermission: "create_and_modify_permissions" },
    
    { name: "Roles", path: "/settings/roles", requiredPermission: "create_and_modify_roles" },
    { name: "Branches", path: "/settings/branches", requiredPermission: "create_and_modify_branches" },
    { name: "Company Profile", path: "/settings/company", requiredPermission: "create_and_modify_company_profile" },
    //{ name: "Subscription", path: "/settings/system_subscription", requiredPermission: "system_subscription" },
    { name: "Billing Channels", path: "/settings/billing-channels", requiredPermission: "create_and_modify_roles" },
];