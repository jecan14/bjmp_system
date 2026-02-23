# Role-Based Access Control - Admin & Officer Separation

## Step 1: Create Middleware

### Create CheckRole Middleware
Run this command in your Laravel project:
```bash
php artisan make:middleware CheckRole
```

### Edit the Middleware File
**File:** `app/Http/Middleware/CheckRole.php`

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            return redirect('/login');
        }

        // Check if user has the required role
        if (Auth::user()->account_type !== $role) {
            // If admin tries to access officer area or vice versa
            abort(403, 'Unauthorized access. You do not have permission to access this area.');
        }

        return $next($request);
    }
}
```

---

## Step 2: Register Middleware

### Edit Kernel File
**File:** `app/Http/Kernel.php` (Laravel 10 and below) OR `bootstrap/app.php` (Laravel 11+)

#### For Laravel 10 and below:
Add to `$middlewareAliases` array:

```php
protected $middlewareAliases = [
    // ... other middleware
    'role' => \App\Http\Middleware\CheckRole::class,
];
```

#### For Laravel 11+:
**File:** `bootstrap/app.php`

```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
```

---

## Step 3: Update Routes with Middleware

### Edit Routes File
**File:** `routes/web.php`

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboard;
use App\Http\Controllers\Officer\DashboardController as OfficerDashboard;

// Public routes
Route::get('/', function () {
    return redirect('/login');
});

// Authentication routes (only for guests)
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [LoginController::class, 'login']);
    Route::get('/register', [RegisterController::class, 'showRegistrationForm'])->name('register');
    Route::post('/register', [RegisterController::class, 'register']);
});

// Logout route (only for authenticated users)
Route::post('/logout', [LogoutController::class, 'logout'])->name('logout')->middleware('auth');

// ========================================
// ADMIN ROUTES - Only for Admin users
// ========================================
Route::prefix('admin')->middleware(['auth', 'role:admin'])->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminDashboard::class, 'index'])->name('dashboard');
    
    // Add more admin-only routes here
    // Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
    // Route::get('/settings', [AdminSettingsController::class, 'index'])->name('settings');
});

// ========================================
// OFFICER ROUTES - Only for Officer users
// ========================================
Route::prefix('officer')->middleware(['auth', 'role:officer'])->name('officer.')->group(function () {
    Route::get('/dashboard', [OfficerDashboard::class, 'index'])->name('dashboard');
    
    // Add more officer-only routes here
    // Route::get('/visitors', [VisitorController::class, 'index'])->name('visitors.index');
    // Route::post('/visitors', [VisitorController::class, 'store'])->name('visitors.store');
});
```

---

## Step 4: Update Login Controller (Already Done)

The LoginController already redirects based on account type:

```php
public function login(Request $request)
{
    $credentials = $request->validate([
        'username' => 'required|string',
        'password' => 'required|string',
    ]);

    if (Auth::attempt($credentials, $request->filled('remember'))) {
        $request->session()->regenerate();

        // REDIRECT BASED ON ACCOUNT TYPE
        if (Auth::user()->account_type === 'admin') {
            return redirect()->route('admin.dashboard'); // /admin/dashboard
        } else {
            return redirect()->route('officer.dashboard'); // /officer/dashboard
        }
    }

    return back()->withErrors([
        'username' => 'The provided credentials do not match our records.',
    ])->onlyInput('username');
}
```

---

## Step 5: Create Dashboard Views

### Admin Dashboard
**File:** `resources/views/admin/dashboard.blade.php`

```blade
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Jail Officer System</title>
    <link rel="stylesheet" href="{{ asset('css/dashboard.css') }}">
</head>
<body>
    <div class="dashboard-container">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="logo-container">
                <img src="{{ asset('images/logo.png') }}" alt="Logo" class="logo">
                <h2>Admin Panel</h2>
            </div>
            
            <nav class="nav-menu">
                <a href="{{ route('admin.dashboard') }}" class="nav-link active">
                    <span>📊</span> Dashboard
                </a>
                <a href="#" class="nav-link">
                    <span>👥</span> Manage Officers
                </a>
                <a href="#" class="nav-link">
                    <span>🔒</span> Manage Prisoners
                </a>
                <a href="#" class="nav-link">
                    <span>👤</span> Visitor Logs
                </a>
                <a href="#" class="nav-link">
                    <span>📈</span> Reports
                </a>
                <a href="#" class="nav-link">
                    <span>⚙️</span> Settings
                </a>
            </nav>

            <form method="POST" action="{{ route('logout') }}" class="logout-form">
                @csrf
                <button type="submit" class="nav-link logout-btn">
                    <span>🚪</span> Logout
                </button>
            </form>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Header -->
            <header class="header">
                <h1>Welcome, {{ Auth::user()->name }}</h1>
                <div class="user-info">
                    <span class="badge badge-admin">ADMIN</span>
                    <span>{{ Auth::user()->email }}</span>
                </div>
            </header>

            <!-- Dashboard Stats -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">👮</div>
                    <div class="stat-info">
                        <h3>Total Officers</h3>
                        <p class="stat-number">{{ $totalOfficers ?? 0 }}</p>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">🔒</div>
                    <div class="stat-info">
                        <h3>Active Prisoners</h3>
                        <p class="stat-number">{{ $totalPrisoners ?? 0 }}</p>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">📅</div>
                    <div class="stat-info">
                        <h3>Today's Visitors</h3>
                        <p class="stat-number">{{ $todayVisitors ?? 0 }}</p>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">📊</div>
                    <div class="stat-info">
                        <h3>Total Visits</h3>
                        <p class="stat-number">{{ $totalVisitors ?? 0 }}</p>
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="content-card">
                <h2>System Overview</h2>
                <p>This is the admin dashboard. You have full access to manage officers, prisoners, and view all visitor logs.</p>
            </div>
        </main>
    </div>
</body>
</html>
```

### Officer Dashboard
**File:** `resources/views/officer/dashboard.blade.php`

```blade
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Officer Dashboard - Jail Officer System</title>
    <link rel="stylesheet" href="{{ asset('css/dashboard.css') }}">
</head>
<body>
    <div class="dashboard-container">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="logo-container">
                <img src="{{ asset('images/logo.png') }}" alt="Logo" class="logo">
                <h2>Officer Panel</h2>
            </div>
            
            <nav class="nav-menu">
                <a href="{{ route('officer.dashboard') }}" class="nav-link active">
                    <span>📊</span> Dashboard
                </a>
                <a href="#" class="nav-link">
                    <span>➕</span> Log Visitor
                </a>
                <a href="#" class="nav-link">
                    <span>👤</span> My Visitor Logs
                </a>
                <a href="#" class="nav-link">
                    <span>🔍</span> Search Prisoner
                </a>
                <a href="#" class="nav-link">
                    <span>📋</span> View History
                </a>
            </nav>

            <form method="POST" action="{{ route('logout') }}" class="logout-form">
                @csrf
                <button type="submit" class="nav-link logout-btn">
                    <span>🚪</span> Logout
                </button>
            </form>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Header -->
            <header class="header">
                <h1>Welcome, {{ Auth::user()->name }}</h1>
                <div class="user-info">
                    <span class="badge badge-officer">OFFICER</span>
                    <span>{{ Auth::user()->email }}</span>
                </div>
            </header>

            <!-- Dashboard Stats -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">📅</div>
                    <div class="stat-info">
                        <h3>Today's Visitors</h3>
                        <p class="stat-number">{{ $todayVisitors ?? 0 }}</p>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">🔒</div>
                    <div class="stat-info">
                        <h3>Active Prisoners</h3>
                        <p class="stat-number">{{ $activePrisoners ?? 0 }}</p>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">📝</div>
                    <div class="stat-info">
                        <h3>My Logs</h3>
                        <p class="stat-number">{{ $myVisitorLogs->count() ?? 0 }}</p>
                    </div>
                </div>
            </div>

            <!-- Recent Visitor Logs -->
            <div class="content-card">
                <h2>Recent Visitor Logs (Your Entries)</h2>
                
                @if($myVisitorLogs && $myVisitorLogs->count() > 0)
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Visitor Name</th>
                                <th>Prisoner</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($myVisitorLogs as $log)
                            <tr>
                                <td>{{ $log->visit_date->format('M d, Y') }}</td>
                                <td>{{ $log->visitor_name }}</td>
                                <td>{{ $log->prisoner->full_name ?? 'N/A' }}</td>
                                <td>{{ $log->visit_time->format('h:i A') }}</td>
                            </tr>
                            @endforeach
                        </tbody>
                    </table>
                @else
                    <p class="no-data">No visitor logs yet. Start logging visitors!</p>
                @endif
            </div>
        </main>
    </div>
</body>
</html>
```

---

## Step 6: Create Dashboard CSS

**File:** `public/css/dashboard.css`

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: #f5f7fa;
}

.dashboard-container {
    display: flex;
    min-height: 100vh;
}

/* ========== SIDEBAR ========== */
.sidebar {
    width: 260px;
    background: white;
    box-shadow: 2px 0 10px rgba(0,0,0,0.1);
    display: flex;
    flex-direction: column;
    position: fixed;
    height: 100vh;
    overflow-y: auto;
}

.logo-container {
    padding: 30px 20px;
    text-align: center;
    border-bottom: 1px solid #eee;
}

.logo {
    width: 80px;
    height: auto;
    margin-bottom: 10px;
}

.logo-container h2 {
    font-size: 18px;
    color: #2c3e50;
}

.nav-menu {
    flex: 1;
    padding: 20px 0;
}

.nav-link {
    display: flex;
    align-items: center;
    padding: 15px 25px;
    color: #555;
    text-decoration: none;
    transition: all 0.3s ease;
    font-size: 15px;
    border-left: 3px solid transparent;
}

.nav-link span {
    margin-right: 12px;
    font-size: 18px;
}

.nav-link:hover {
    background: #f8f9fa;
    color: #3498db;
    border-left-color: #3498db;
}

.nav-link.active {
    background: #e3f2fd;
    color: #3498db;
    border-left-color: #3498db;
    font-weight: 600;
}

.logout-form {
    border-top: 1px solid #eee;
    padding: 10px 0;
}

.logout-btn {
    width: 100%;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 15px;
}

.logout-btn:hover {
    background: #ffebee;
    color: #e74c3c;
    border-left-color: #e74c3c;
}

/* ========== MAIN CONTENT ========== */
.main-content {
    margin-left: 260px;
    flex: 1;
    padding: 30px;
}

.header {
    background: white;
    padding: 25px 30px;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    margin-bottom: 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header h1 {
    font-size: 24px;
    color: #2c3e50;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 15px;
    font-size: 14px;
    color: #666;
}

.badge {
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
}

.badge-admin {
    background: #e3f2fd;
    color: #1976d2;
}

.badge-officer {
    background: #e8f5e9;
    color: #388e3c;
}

/* ========== STATS GRID ========== */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.stat-card {
    background: white;
    padding: 25px;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    display: flex;
    align-items: center;
    gap: 20px;
    transition: transform 0.3s ease;
}

.stat-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.stat-icon {
    font-size: 40px;
    width: 70px;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    border-radius: 12px;
}

.stat-info h3 {
    font-size: 13px;
    color: #666;
    margin-bottom: 8px;
    font-weight: 500;
}

.stat-number {
    font-size: 28px;
    font-weight: 700;
    color: #2c3e50;
}

/* ========== CONTENT CARD ========== */
.content-card {
    background: white;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.content-card h2 {
    font-size: 20px;
    color: #2c3e50;
    margin-bottom: 20px;
}

.content-card p {
    color: #666;
    line-height: 1.6;
}

/* ========== TABLE ========== */
.data-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
}

.data-table thead {
    background: #f8f9fa;
}

.data-table th {
    padding: 15px;
    text-align: left;
    font-weight: 600;
    color: #2c3e50;
    font-size: 14px;
    border-bottom: 2px solid #e0e0e0;
}

.data-table td {
    padding: 15px;
    border-bottom: 1px solid #f0f0f0;
    color: #555;
    font-size: 14px;
}

.data-table tbody tr:hover {
    background: #f8f9fa;
}

.no-data {
    text-align: center;
    padding: 40px;
    color: #999;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
    .sidebar {
        width: 200px;
    }
    
    .main-content {
        margin-left: 200px;
        padding: 15px;
    }
    
    .header {
        flex-direction: column;
        gap: 15px;
        align-items: flex-start;
    }
    
    .stats-grid {
        grid-template-columns: 1fr;
    }
}
```

---

## Step 7: Create Folders for Views

```bash
# Create admin and officer view folders
mkdir resources/views/admin
mkdir resources/views/officer
```

---

## How It Works:

### 1. **User Logs In**
   - Enters username & password
   - System checks credentials

### 2. **System Checks Account Type**
   - If `account_type = 'admin'` → Redirect to `/admin/dashboard`
   - If `account_type = 'officer'` → Redirect to `/officer/dashboard`

### 3. **Middleware Protection**
   - Admin tries to access `/officer/dashboard` → **403 Forbidden**
   - Officer tries to access `/admin/dashboard` → **403 Forbidden**
   - Not logged in tries to access any dashboard → **Redirect to login**

### 4. **Route Protection**
   ```php
   // Admin routes - only admin can access
   Route::middleware(['auth', 'role:admin'])
   
   // Officer routes - only officer can access
   Route::middleware(['auth', 'role:officer'])
   ```

---

## Testing Access Control:

### Test 1: Login as Admin
1. Login with admin credentials
2. Should redirect to `/admin/dashboard`
3. Try accessing `/officer/dashboard` → Should get 403 error

### Test 2: Login as Officer
1. Login with officer credentials
2. Should redirect to `/officer/dashboard`
3. Try accessing `/admin/dashboard` → Should get 403 error

### Test 3: Not Logged In
1. Try accessing `/admin/dashboard` directly → Redirect to login
2. Try accessing `/officer/dashboard` directly → Redirect to login

---

## Summary

✅ **Middleware created** - `CheckRole` checks user account type
✅ **Routes protected** - Admin and Officer routes separated
✅ **Dashboards created** - Different views for Admin and Officer
✅ **Auto-redirect on login** - Based on account type
✅ **Access control** - Prevents unauthorized access

You're all set! Admin and Officer now have completely separate dashboards! 🎉
