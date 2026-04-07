const allowedOrigins = "http://localhost:3000,http://localhost:5173,http://localhost:3001,http://localhost:5174,https://dynamic-yeot-32ded1.netlify.app"
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

console.log("Allowed Origins:", allowedOrigins);

const targetOrigin = "https://dynamic-yeot-32ded1.netlify.app";
const isAllowed = allowedOrigins.includes(targetOrigin);
console.log(`Is "${targetOrigin}" allowed?`, isAllowed);

if (isAllowed) {
    console.log("Verification SUCCESS: Netlify origin is correctly parsed and allowed.");
} else {
    console.log("Verification FAILED: Netlify origin is not in the allowed list.");
    process.exit(1);
}
