# API Issues

> Troubleshooting API and network problems

## Quick Reference

| Status | Meaning | Solution |
|--------|---------|----------|
| 401 | Unauthorized | Refresh token or re-login |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Check URL, resource exists |
| 422 | Validation Error | Fix form data |
| 500 | Server Error | Check backend logs |
| CORS | Origin blocked | Configure proxy |

---

## 401 Unauthorized

### Symptoms

- API calls return 401
- User redirected to login
- "Session expired" message

### Causes

1. **Token expired** - JWT token past expiration
2. **Token missing** - Not attached to request
3. **Invalid token** - Token corrupted or revoked

### Solutions

```typescript
// Check if token exists
const token = localStorage.getItem('token')
console.log('Token:', token ? 'exists' : 'missing')

// Check token expiration
const payload = JSON.parse(atob(token.split('.')[1]))
console.log('Expires:', new Date(payload.exp * 1000))
console.log('Now:', new Date())
```

### Auto-refresh Not Working

Check `src/api/client.ts`:

```typescript
// Token refresh intercepts 401 and retries
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true
      await authStore.refreshToken()
      return api(error.config)
    }
    return Promise.reject(error)
  }
)
```

---

## 422 Validation Error

### Symptoms

- Form submission fails
- Red error messages appear
- `errors` object in response

### Response Format

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "name": ["The name must be at least 3 characters."]
  }
}
```

### Displaying Errors

```vue
<script setup>
const { mutate, error } = useCreateContact()

const validationErrors = computed(() => {
  if (error.value?.response?.status === 422) {
    return error.value.response.data.errors
  }
  return {}
})
</script>

<template>
  <FormField label="Email" :error="validationErrors.email?.[0]">
    <Input v-model="form.email" />
  </FormField>
</template>
```

### Common Validation Issues

| Error | Cause | Fix |
|-------|-------|-----|
| "required" | Empty field | Fill in field |
| "must be email" | Invalid format | Check format |
| "already taken" | Duplicate value | Use unique value |
| "must be numeric" | Wrong type | Send number, not string |

---

## CORS Errors

### Symptoms

```
Access to XMLHttpRequest at 'https://api.example.com'
from origin 'http://localhost:3000' has been blocked
by CORS policy
```

### In Development

CORS should not occur because Vite proxies requests:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'https://enter365.test',
      changeOrigin: true,
    }
  }
}
```

**If you see CORS in development:**
1. Check you're using relative URLs: `/api/...` not `https://api.../`
2. Restart Vite: `npm run dev`
3. Check proxy configuration

### In Production

Configure backend CORS:

```php
// Laravel: config/cors.php
return [
    'paths' => ['api/*'],
    'allowed_origins' => ['https://app.enter365.com'],
    'allowed_methods' => ['*'],
    'allowed_headers' => ['*'],
];
```

---

## Network Errors

### Symptoms

- Request fails with no status code
- `Network Error` message
- Timeout errors

### Causes

| Cause | Check |
|-------|-------|
| Backend down | Is Laravel running? |
| Wrong URL | Check `VITE_API_URL` |
| SSL issue | Check certificate |
| Firewall | Check network access |

### Debug Steps

```bash
# Check if backend is reachable
curl https://enter365.test/api/health

# Check from browser console
fetch('/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

---

## Slow Requests

### Symptoms

- Long loading times
- Timeout errors
- Spinner shows for too long

### Diagnosis

```typescript
// Check network timing in DevTools
// Network tab → Click request → Timing tab

// Common bottlenecks:
// - DNS Lookup: DNS issue
// - Connection: Server unreachable
// - TTFB: Slow backend
// - Content Download: Large response
```

### Solutions

| Issue | Solution |
|-------|----------|
| Large response | Paginate data |
| Slow query | Optimize backend |
| Many requests | Batch or cache |
| Cold start | Keep backend warm |

---

## Request Not Sent

### Symptoms

- No request in Network tab
- No error message
- Nothing happens on click

### Causes

```typescript
// 1. Conditional prevents request
const { data } = useContacts(
  { enabled: !!selectedId }  // Won't run if selectedId is falsy
)

// 2. Mutation not called
const { mutate } = useCreateContact()
// Did you forget to call mutate()?

// 3. Query disabled
const { data } = useContact(id, {
  enabled: false  // Query won't run
})
```

---

## Response Parsing Error

### Symptoms

- `Unexpected token` error
- `JSON.parse` error
- Response looks garbled

### Causes

```typescript
// Backend returning non-JSON
// Check response in Network tab → Response

// Common issues:
// - HTML error page (check for <html>)
// - PHP warning/error before JSON
// - Empty response
// - BOM characters
```

### Debug

```typescript
// Check raw response
api.get('/contacts')
  .then(response => {
    console.log('Status:', response.status)
    console.log('Headers:', response.headers)
    console.log('Data:', response.data)
    console.log('Type:', typeof response.data)
  })
```

---

## File Upload Issues

### Large File Fails

```typescript
// PHP upload limits
// Check php.ini:
// upload_max_filesize = 50M
// post_max_size = 50M

// Nginx limits
// client_max_body_size 50M;
```

### Progress Not Showing

```typescript
// Use onUploadProgress
const response = await api.post('/upload', formData, {
  onUploadProgress: (progressEvent) => {
    const percent = Math.round(
      (progressEvent.loaded * 100) / progressEvent.total
    )
    console.log(`Upload: ${percent}%`)
  }
})
```

---

## Debugging Checklist

### API Call Not Working

- [ ] Check Network tab for request
- [ ] Check request URL is correct
- [ ] Check request method (GET/POST/etc.)
- [ ] Check request headers (Authorization)
- [ ] Check request body format
- [ ] Check response status code
- [ ] Check response body
- [ ] Check console for errors

### After Deployment

- [ ] Environment variables set
- [ ] API URL points to production
- [ ] CORS configured on backend
- [ ] SSL certificate valid
- [ ] Firewall allows traffic

---

## Related Documentation

- [README.md](README.md) - Troubleshooting overview
- [../api/AUTHENTICATION.md](../api/AUTHENTICATION.md) - Auth flow
- [../api/ERROR-HANDLING.md](../api/ERROR-HANDLING.md) - Error handling
