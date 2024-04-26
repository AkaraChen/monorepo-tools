import Ajv from "ajv";
import { PackageJson } from "read-package-up";

const ajv = new Ajv();

export const packageJsonSchema = await fetch(
    "https://json.schemastore.org/package.json"
).then((res) => res.json());

export const validatePackageJson = (pkg: any): PackageJson => {
    if (!ajv.validate(packageJsonSchema, pkg)) {
        throw new Error(ajv.errorsText());
    }
    return pkg as PackageJson;
};
