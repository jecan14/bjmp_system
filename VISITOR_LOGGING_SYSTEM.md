# Visitor Logging System - Complete Implementation Guide

## Overview
This module allows officers to log visitors, track visit times, search visitor history, and manage check-ins/check-outs.

---

## Step 1: Create Visitor Controller

```bash
php artisan make:controller VisitorController --resource
```

### Edit Visitor Controller
**File:** `app/Http/Controllers/VisitorController.php`

```php
<?php

namespace App\Http\Controllers;

use App\Models\Visitor;
use App\Models\Prisoner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class VisitorController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Display a listing of visitors
     */
    public function index(Request $request)
    {
        $query = Visitor::with(['prisoner', 'officer'])
            ->orderBy('created_at', 'desc');

        // Search functionality
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('visitor_name', 'like', "%{$search}%")
                  ->orWhere('visitor_contact', 'like', "%{$search}%")
                  ->orWhere('visitor_id_number', 'like', "%{$search}%");
            });
        }

        // Filter by date
        if ($request->has('date') && $request->date != '') {
            $query->whereDate('visit_date', $request->date);
        }

        // Filter by prisoner
        if ($request->has('prisoner_id') && $request->prisoner_id != '') {
            $query->where('prisoner_id', $request->prisoner_id);
        }

        // For officers, show only their logs (optional - remove if you want officers to see all)
        if (Auth::user()->account_type === 'officer') {
            $query->where('logged_by', Auth::id());
        }

        $visitors = $query->paginate(15);
        $prisoners = Prisoner::where('status', 'active')->get();

        return view('visitors.index', compact('visitors', 'prisoners'));
    }

    /**
     * Show the form for creating a new visitor
     */
    public function create()
    {
        $prisoners = Prisoner::where('status', 'active')
            ->orderBy('first_name')
            ->get();

        return view('visitors.create', compact('prisoners'));
    }

    /**
     * Store a newly created visitor in database
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'visitor_name' => 'required|string|max:255',
            'visitor_id_number' => 'nullable|string|max:255',
            'visitor_contact' => 'required|string|max:20',
            'relationship' => 'required|string|max:255',
            'prisoner_id' => 'required|exists:prisoners,id',
            'visit_date' => 'required|date',
            'visit_time' => 'required',
            'notes' => 'nullable|string',
        ]);

        $validated['logged_by'] = Auth::id();

        Visitor::create($validated);

        return redirect()
            ->route('visitors.index')
            ->with('success', 'Visitor logged successfully!');
    }

    /**
     * Display the specified visitor
     */
    public function show(Visitor $visitor)
    {
        $visitor->load(['prisoner', 'officer']);
        return view('visitors.show', compact('visitor'));
    }

    /**
     * Show the form for editing the specified visitor
     */
    public function edit(Visitor $visitor)
    {
        // Optional: Only allow editing own logs
        if (Auth::user()->account_type === 'officer' && $visitor->logged_by !== Auth::id()) {
            abort(403, 'You can only edit your own visitor logs.');
        }

        $prisoners = Prisoner::where('status', 'active')
            ->orderBy('first_name')
            ->get();

        return view('visitors.edit', compact('visitor', 'prisoners'));
    }

    /**
     * Update the specified visitor in database
     */
    public function update(Request $request, Visitor $visitor)
    {
        // Optional: Only allow editing own logs
        if (Auth::user()->account_type === 'officer' && $visitor->logged_by !== Auth::id()) {
            abort(403, 'You can only edit your own visitor logs.');
        }

        $validated = $request->validate([
            'visitor_name' => 'required|string|max:255',
            'visitor_id_number' => 'nullable|string|max:255',
            'visitor_contact' => 'required|string|max:20',
            'relationship' => 'required|string|max:255',
            'prisoner_id' => 'required|exists:prisoners,id',
            'visit_date' => 'required|date',
            'visit_time' => 'required',
            'checkout_time' => 'nullable',
            'notes' => 'nullable|string',
        ]);

        $visitor->update($validated);

        return redirect()
            ->route('visitors.index')
            ->with('success', 'Visitor updated successfully!');
    }

    /**
     * Remove the specified visitor from database
     */
    public function destroy(Visitor $visitor)
    {
        // Optional: Only allow deleting own logs
        if (Auth::user()->account_type === 'officer' && $visitor->logged_by !== Auth::id()) {
            abort(403, 'You can only delete your own visitor logs.');
        }

        $visitor->delete();

        return redirect()
            ->route('visitors.index')
            ->with('success', 'Visitor log deleted successfully!');
    }

    /**
     * Check out a visitor
     */
    public function checkout(Visitor $visitor)
    {
        if ($visitor->checkout_time) {
            return redirect()
                ->route('visitors.index')
                ->with('error', 'Visitor already checked out!');
        }

        $visitor->update([
            'checkout_time' => now()
        ]);

        return redirect()
            ->route('visitors.index')
            ->with('success', 'Visitor checked out successfully!');
    }

    /**
     * Get today's visitors
     */
    public function today()
    {
        $visitors = Visitor::with(['prisoner', 'officer'])
            ->whereDate('visit_date', today())
            ->orderBy('visit_time', 'desc')
            ->get();

        $prisoners = Prisoner::where('status', 'active')->get();

        return view('visitors.today', compact('visitors', 'prisoners'));
    }
}
```

---

## Step 2: Update Routes

**File:** `routes/web.php`

Add these routes inside the authenticated group:

```php
// ========================================
// VISITOR ROUTES - For both Admin & Officer
// ========================================
Route::middleware('auth')->group(function () {
    Route::resource('visitors', VisitorController::class);
    Route::post('/visitors/{visitor}/checkout', [VisitorController::class, 'checkout'])->name('visitors.checkout');
    Route::get('/visitors-today', [VisitorController::class, 'today'])->name('visitors.today');
});
```

Full updated routes file:

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboard;
use App\Http\Controllers\Officer\DashboardController as OfficerDashboard;
use App\Http\Controllers\VisitorController;

// Public routes
Route::get('/', function () {
    return redirect('/login');
});

// Authentication routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [LoginController::class, 'login']);
    Route::get('/register', [RegisterController::class, 'showRegistrationForm'])->name('register');
    Route::post('/register', [RegisterController::class, 'register']);
});

Route::post('/logout', [LogoutController::class, 'logout'])->name('logout')->middleware('auth');

// Protected routes
Route::middleware('auth')->group(function () {
    
    // Visitor routes - accessible by both admin and officer
    Route::resource('visitors', VisitorController::class);
    Route::post('/visitors/{visitor}/checkout', [VisitorController::class, 'checkout'])->name('visitors.checkout');
    Route::get('/visitors-today', [VisitorController::class, 'today'])->name('visitors.today');
    
    // Admin routes
    Route::prefix('admin')->middleware('role:admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [AdminDashboard::class, 'index'])->name('dashboard');
    });

    // Officer routes
    Route::prefix('officer')->middleware('role:officer')->name('officer.')->group(function () {
        Route::get('/dashboard', [OfficerDashboard::class, 'index'])->name('dashboard');
    });
});
```

---

## Step 3: Create Prisoner Management (Quick Setup)

We need prisoners in the database to assign visitors to them.

### Create Prisoner Controller

```bash
php artisan make:controller PrisonerController --resource
```

**File:** `app/Http/Controllers/PrisonerController.php`

```php
<?php

namespace App\Http\Controllers;

use App\Models\Prisoner;
use Illuminate\Http\Request;

class PrisonerController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index()
    {
        $prisoners = Prisoner::orderBy('created_at', 'desc')->paginate(20);
        return view('prisoners.index', compact('prisoners'));
    }

    public function create()
    {
        return view('prisoners.create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'prisoner_number' => 'required|string|unique:prisoners,prisoner_number',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'date_of_birth' => 'required|date',
            'status' => 'required|in:active,transferred,released',
            'remarks' => 'nullable|string',
        ]);

        Prisoner::create($validated);

        return redirect()->route('prisoners.index')->with('success', 'Prisoner added successfully!');
    }

    public function show(Prisoner $prisoner)
    {
        $prisoner->load('visitors.officer');
        return view('prisoners.show', compact('prisoner'));
    }

    public function edit(Prisoner $prisoner)
    {
        return view('prisoners.edit', compact('prisoner'));
    }

    public function update(Request $request, Prisoner $prisoner)
    {
        $validated = $request->validate([
            'prisoner_number' => 'required|string|unique:prisoners,prisoner_number,' . $prisoner->id,
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'date_of_birth' => 'required|date',
            'status' => 'required|in:active,transferred,released',
            'remarks' => 'nullable|string',
        ]);

        $prisoner->update($validated);

        return redirect()->route('prisoners.index')->with('success', 'Prisoner updated successfully!');
    }

    public function destroy(Prisoner $prisoner)
    {
        $prisoner->delete();
        return redirect()->route('prisoners.index')->with('success', 'Prisoner deleted successfully!');
    }
}
```

### Add Prisoner Routes

```php
// Add to routes/web.php inside authenticated group
Route::resource('prisoners', PrisonerController::class);
```

---

## Step 4: Create Visitor Views

### Create visitors folder
```bash
mkdir resources/views/visitors
```

### 4.1 Visitor List (Index)
**File:** `resources/views/visitors/index.blade.php`

```blade
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visitor Logs - Jail Officer System</title>
    <link rel="stylesheet" href="{{ asset('css/dashboard.css') }}">
    <link rel="stylesheet" href="{{ asset('css/visitors.css') }}">
</head>
<body>
    <div class="dashboard-container">
        @include('layouts.sidebar')

        <main class="main-content">
            <header class="header">
                <h1>Visitor Logs</h1>
                <div class="header-actions">
                    <a href="{{ route('visitors.create') }}" class="btn btn-primary">+ Log New Visitor</a>
                </div>
            </header>

            @if(session('success'))
                <div class="alert alert-success">{{ session('success') }}</div>
            @endif

            @if(session('error'))
                <div class="alert alert-error">{{ session('error') }}</div>
            @endif

            <!-- Search & Filter -->
            <div class="content-card">
                <form method="GET" action="{{ route('visitors.index') }}" class="filter-form">
                    <div class="filter-group">
                        <input type="text" name="search" placeholder="Search visitor name, contact, ID..." value="{{ request('search') }}">
                        
                        <input type="date" name="date" value="{{ request('date') }}">
                        
                        <select name="prisoner_id">
                            <option value="">All Prisoners</option>
                            @foreach($prisoners as $prisoner)
                                <option value="{{ $prisoner->id }}" {{ request('prisoner_id') == $prisoner->id ? 'selected' : '' }}>
                                    {{ $prisoner->full_name }}
                                </option>
                            @endforeach
                        </select>
                        
                        <button type="submit" class="btn btn-secondary">🔍 Search</button>
                        <a href="{{ route('visitors.index') }}" class="btn btn-light">Clear</a>
                    </div>
                </form>
            </div>

            <!-- Visitors Table -->
            <div class="content-card">
                <h2>Visitor Records ({{ $visitors->total() }})</h2>

                @if($visitors->count() > 0)
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Visitor Name</th>
                                <th>Contact</th>
                                <th>Prisoner</th>
                                <th>Relationship</th>
                                <th>Check-in</th>
                                <th>Check-out</th>
                                <th>Logged By</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($visitors as $visitor)
                            <tr>
                                <td>{{ $visitor->visit_date->format('M d, Y') }}</td>
                                <td><strong>{{ $visitor->visitor_name }}</strong></td>
                                <td>{{ $visitor->visitor_contact }}</td>
                                <td>{{ $visitor->prisoner->full_name ?? 'N/A' }}</td>
                                <td>{{ $visitor->relationship }}</td>
                                <td>{{ \Carbon\Carbon::parse($visitor->visit_time)->format('h:i A') }}</td>
                                <td>
                                    @if($visitor->checkout_time)
                                        <span class="badge badge-success">{{ \Carbon\Carbon::parse($visitor->checkout_time)->format('h:i A') }}</span>
                                    @else
                                        <span class="badge badge-warning">Still Inside</span>
                                    @endif
                                </td>
                                <td>{{ $visitor->officer->name ?? 'N/A' }}</td>
                                <td>
                                    <div class="action-buttons">
                                        <a href="{{ route('visitors.show', $visitor) }}" class="btn-icon" title="View">👁️</a>
                                        <a href="{{ route('visitors.edit', $visitor) }}" class="btn-icon" title="Edit">✏️</a>
                                        
                                        @if(!$visitor->checkout_time)
                                            <form method="POST" action="{{ route('visitors.checkout', $visitor) }}" style="display: inline;">
                                                @csrf
                                                <button type="submit" class="btn-icon" title="Check Out" onclick="return confirm('Check out this visitor?')">🚪</button>
                                            </form>
                                        @endif
                                        
                                        <form method="POST" action="{{ route('visitors.destroy', $visitor) }}" style="display: inline;">
                                            @csrf
                                            @method('DELETE')
                                            <button type="submit" class="btn-icon btn-danger" title="Delete" onclick="return confirm('Delete this record?')">🗑️</button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                            @endforeach
                        </tbody>
                    </table>

                    <div class="pagination">
                        {{ $visitors->links() }}
                    </div>
                @else
                    <p class="no-data">No visitor records found.</p>
                @endif
            </div>
        </main>
    </div>
</body>
</html>
```

### 4.2 Add New Visitor Form
**File:** `resources/views/visitors/create.blade.php`

```blade
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Log New Visitor - Jail Officer System</title>
    <link rel="stylesheet" href="{{ asset('css/dashboard.css') }}">
    <link rel="stylesheet" href="{{ asset('css/visitors.css') }}">
</head>
<body>
    <div class="dashboard-container">
        @include('layouts.sidebar')

        <main class="main-content">
            <header class="header">
                <h1>Log New Visitor</h1>
                <a href="{{ route('visitors.index') }}" class="btn btn-secondary">← Back to List</a>
            </header>

            <div class="content-card">
                @if($errors->any())
                    <div class="alert alert-error">
                        <ul>
                            @foreach($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif

                <form method="POST" action="{{ route('visitors.store') }}" class="visitor-form">
                    @csrf

                    <div class="form-row">
                        <div class="form-group">
                            <label for="visitor_name">Visitor Name <span class="required">*</span></label>
                            <input type="text" id="visitor_name" name="visitor_name" value="{{ old('visitor_name') }}" required>
                        </div>

                        <div class="form-group">
                            <label for="visitor_id_number">ID Number</label>
                            <input type="text" id="visitor_id_number" name="visitor_id_number" value="{{ old('visitor_id_number') }}" placeholder="Driver's License, National ID, etc.">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="visitor_contact">Contact Number <span class="required">*</span></label>
                            <input type="tel" id="visitor_contact" name="visitor_contact" value="{{ old('visitor_contact') }}" required>
                        </div>

                        <div class="form-group">
                            <label for="relationship">Relationship to Prisoner <span class="required">*</span></label>
                            <select id="relationship" name="relationship" required>
                                <option value="">Select Relationship</option>
                                <option value="Spouse" {{ old('relationship') == 'Spouse' ? 'selected' : '' }}>Spouse</option>
                                <option value="Parent" {{ old('relationship') == 'Parent' ? 'selected' : '' }}>Parent</option>
                                <option value="Child" {{ old('relationship') == 'Child' ? 'selected' : '' }}>Child</option>
                                <option value="Sibling" {{ old('relationship') == 'Sibling' ? 'selected' : '' }}>Sibling</option>
                                <option value="Relative" {{ old('relationship') == 'Relative' ? 'selected' : '' }}>Relative</option>
                                <option value="Friend" {{ old('relationship') == 'Friend' ? 'selected' : '' }}>Friend</option>
                                <option value="Lawyer" {{ old('relationship') == 'Lawyer' ? 'selected' : '' }}>Lawyer</option>
                                <option value="Other" {{ old('relationship') == 'Other' ? 'selected' : '' }}>Other</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="prisoner_id">Visiting Prisoner <span class="required">*</span></label>
                        <select id="prisoner_id" name="prisoner_id" required>
                            <option value="">Select Prisoner</option>
                            @foreach($prisoners as $prisoner)
                                <option value="{{ $prisoner->id }}" {{ old('prisoner_id') == $prisoner->id ? 'selected' : '' }}>
                                    {{ $prisoner->prisoner_number }} - {{ $prisoner->full_name }}
                                </option>
                            @endforeach
                        </select>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="visit_date">Visit Date <span class="required">*</span></label>
                            <input type="date" id="visit_date" name="visit_date" value="{{ old('visit_date', date('Y-m-d')) }}" required>
                        </div>

                        <div class="form-group">
                            <label for="visit_time">Visit Time <span class="required">*</span></label>
                            <input type="time" id="visit_time" name="visit_time" value="{{ old('visit_time', date('H:i')) }}" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="notes">Notes / Remarks</label>
                        <textarea id="notes" name="notes" rows="4">{{ old('notes') }}</textarea>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">✓ Log Visitor</button>
                        <a href="{{ route('visitors.index') }}" class="btn btn-light">Cancel</a>
                    </div>
                </form>
            </div>
        </main>
    </div>
</body>
</html>
```

### 4.3 Edit Visitor Form
**File:** `resources/views/visitors/edit.blade.php`

```blade
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Visitor - Jail Officer System</title>
    <link rel="stylesheet" href="{{ asset('css/dashboard.css') }}">
    <link rel="stylesheet" href="{{ asset('css/visitors.css') }}">
</head>
<body>
    <div class="dashboard-container">
        @include('layouts.sidebar')

        <main class="main-content">
            <header class="header">
                <h1>Edit Visitor Log</h1>
                <a href="{{ route('visitors.index') }}" class="btn btn-secondary">← Back to List</a>
            </header>

            <div class="content-card">
                @if($errors->any())
                    <div class="alert alert-error">
                        <ul>
                            @foreach($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif

                <form method="POST" action="{{ route('visitors.update', $visitor) }}" class="visitor-form">
                    @csrf
                    @method('PUT')

                    <div class="form-row">
                        <div class="form-group">
                            <label for="visitor_name">Visitor Name <span class="required">*</span></label>
                            <input type="text" id="visitor_name" name="visitor_name" value="{{ old('visitor_name', $visitor->visitor_name) }}" required>
                        </div>

                        <div class="form-group">
                            <label for="visitor_id_number">ID Number</label>
                            <input type="text" id="visitor_id_number" name="visitor_id_number" value="{{ old('visitor_id_number', $visitor->visitor_id_number) }}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="visitor_contact">Contact Number <span class="required">*</span></label>
                            <input type="tel" id="visitor_contact" name="visitor_contact" value="{{ old('visitor_contact', $visitor->visitor_contact) }}" required>
                        </div>

                        <div class="form-group">
                            <label for="relationship">Relationship to Prisoner <span class="required">*</span></label>
                            <select id="relationship" name="relationship" required>
                                <option value="">Select Relationship</option>
                                <option value="Spouse" {{ old('relationship', $visitor->relationship) == 'Spouse' ? 'selected' : '' }}>Spouse</option>
                                <option value="Parent" {{ old('relationship', $visitor->relationship) == 'Parent' ? 'selected' : '' }}>Parent</option>
                                <option value="Child" {{ old('relationship', $visitor->relationship) == 'Child' ? 'selected' : '' }}>Child</option>
                                <option value="Sibling" {{ old('relationship', $visitor->relationship) == 'Sibling' ? 'selected' : '' }}>Sibling</option>
                                <option value="Relative" {{ old('relationship', $visitor->relationship) == 'Relative' ? 'selected' : '' }}>Relative</option>
                                <option value="Friend" {{ old('relationship', $visitor->relationship) == 'Friend' ? 'selected' : '' }}>Friend</option>
                                <option value="Lawyer" {{ old('relationship', $visitor->relationship) == 'Lawyer' ? 'selected' : '' }}>Lawyer</option>
                                <option value="Other" {{ old('relationship', $visitor->relationship) == 'Other' ? 'selected' : '' }}>Other</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="prisoner_id">Visiting Prisoner <span class="required">*</span></label>
                        <select id="prisoner_id" name="prisoner_id" required>
                            <option value="">Select Prisoner</option>
                            @foreach($prisoners as $prisoner)
                                <option value="{{ $prisoner->id }}" {{ old('prisoner_id', $visitor->prisoner_id) == $prisoner->id ? 'selected' : '' }}>
                                    {{ $prisoner->prisoner_number }} - {{ $prisoner->full_name }}
                                </option>
                            @endforeach
                        </select>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="visit_date">Visit Date <span class="required">*</span></label>
                            <input type="date" id="visit_date" name="visit_date" value="{{ old('visit_date', $visitor->visit_date->format('Y-m-d')) }}" required>
                        </div>

                        <div class="form-group">
                            <label for="visit_time">Check-in Time <span class="required">*</span></label>
                            <input type="time" id="visit_time" name="visit_time" value="{{ old('visit_time', \Carbon\Carbon::parse($visitor->visit_time)->format('H:i')) }}" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="checkout_time">Check-out Time</label>
                            <input type="time" id="checkout_time" name="checkout_time" value="{{ old('checkout_time', $visitor->checkout_time ? \Carbon\Carbon::parse($visitor->checkout_time)->format('H:i') : '') }}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="notes">Notes / Remarks</label>
                        <textarea id="notes" name="notes" rows="4">{{ old('notes', $visitor->notes) }}</textarea>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">✓ Update Visitor</button>
                        <a href="{{ route('visitors.index') }}" class="btn btn-light">Cancel</a>
                    </div>
                </form>
            </div>
        </main>
    </div>
</body>
</html>
```

### 4.4 View Visitor Details
**File:** `resources/views/visitors/show.blade.php`

```blade
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visitor Details - Jail Officer System</title>
    <link rel="stylesheet" href="{{ asset('css/dashboard.css') }}">
    <link rel="stylesheet" href="{{ asset('css/visitors.css') }}">
</head>
<body>
    <div class="dashboard-container">
        @include('layouts.sidebar')

        <main class="main-content">
            <header class="header">
                <h1>Visitor Details</h1>
                <div class="header-actions">
                    <a href="{{ route('visitors.edit', $visitor) }}" class="btn btn-primary">Edit</a>
                    <a href="{{ route('visitors.index') }}" class="btn btn-secondary">← Back</a>
                </div>
            </header>

            <div class="content-card">
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Visitor Name</label>
                        <p><strong>{{ $visitor->visitor_name }}</strong></p>
                    </div>

                    <div class="detail-item">
                        <label>ID Number</label>
                        <p>{{ $visitor->visitor_id_number ?? 'N/A' }}</p>
                    </div>

                    <div class="detail-item">
                        <label>Contact Number</label>
                        <p>{{ $visitor->visitor_contact }}</p>
                    </div>

                    <div class="detail-item">
                        <label>Relationship</label>
                        <p>{{ $visitor->relationship }}</p>
                    </div>

                    <div class="detail-item">
                        <label>Visiting Prisoner</label>
                        <p><strong>{{ $visitor->prisoner->full_name ?? 'N/A' }}</strong><br>
                        <small>Prisoner #{{ $visitor->prisoner->prisoner_number ?? 'N/A' }}</small></p>
                    </div>

                    <div class="detail-item">
                        <label>Visit Date</label>
                        <p>{{ $visitor->visit_date->format('F d, Y') }}</p>
                    </div>

                    <div class="detail-item">
                        <label>Check-in Time</label>
                        <p>{{ \Carbon\Carbon::parse($visitor->visit_time)->format('h:i A') }}</p>
                    </div>

                    <div class="detail-item">
                        <label>Check-out Time</label>
                        <p>
                            @if($visitor->checkout_time)
                                {{ \Carbon\Carbon::parse($visitor->checkout_time)->format('h:i A') }}
                                <span class="badge badge-success">Checked Out</span>
                            @else
                                <span class="badge badge-warning">Still Inside</span>
                            @endif
                        </p>
                    </div>

                    <div class="detail-item full-width">
                        <label>Logged By</label>
                        <p>{{ $visitor->officer->name ?? 'N/A' }}<br>
                        <small>{{ $visitor->created_at->format('F d, Y h:i A') }}</small></p>
                    </div>

                    @if($visitor->notes)
                    <div class="detail-item full-width">
                        <label>Notes / Remarks</label>
                        <p>{{ $visitor->notes }}</p>
                    </div>
                    @endif
                </div>

                @if(!$visitor->checkout_time)
                <div class="form-actions">
                    <form method="POST" action="{{ route('visitors.checkout', $visitor) }}">
                        @csrf
                        <button type="submit" class="btn btn-primary" onclick="return confirm('Check out this visitor?')">🚪 Check Out Visitor</button>
                    </form>
                </div>
                @endif
            </div>
        </main>
    </div>
</body>
</html>
```

---

## Step 5: Create Sidebar Layout (Reusable)

**File:** `resources/views/layouts/sidebar.blade.php`

```blade
<aside class="sidebar">
    <div class="logo-container">
        <img src="{{ asset('images/logo.png') }}" alt="Logo" class="logo">
        <h2>
            @if(Auth::user()->account_type === 'admin')
                Admin Panel
            @else
                Officer Panel
            @endif
        </h2>
    </div>
    
    <nav class="nav-menu">
        @if(Auth::user()->account_type === 'admin')
            <a href="{{ route('admin.dashboard') }}" class="nav-link {{ request()->routeIs('admin.dashboard') ? 'active' : '' }}">
                <span>📊</span> Dashboard
            </a>
            <a href="{{ route('visitors.index') }}" class="nav-link {{ request()->routeIs('visitors.*') ? 'active' : '' }}">
                <span>👤</span> Visitor Logs
            </a>
            <a href="{{ route('prisoners.index') }}" class="nav-link {{ request()->routeIs('prisoners.*') ? 'active' : '' }}">
                <span>🔒</span> Prisoners
            </a>
            <a href="#" class="nav-link">
                <span>👥</span> Manage Officers
            </a>
            <a href="#" class="nav-link">
                <span>📈</span> Reports
            </a>
            <a href="#" class="nav-link">
                <span>⚙️</span> Settings
            </a>
        @else
            <a href="{{ route('officer.dashboard') }}" class="nav-link {{ request()->routeIs('officer.dashboard') ? 'active' : '' }}">
                <span>📊</span> Dashboard
            </a>
            <a href="{{ route('visitors.create') }}" class="nav-link {{ request()->routeIs('visitors.create') ? 'active' : '' }}">
                <span>➕</span> Log Visitor
            </a>
            <a href="{{ route('visitors.index') }}" class="nav-link {{ request()->routeIs('visitors.index') || request()->routeIs('visitors.edit') || request()->routeIs('visitors.show') ? 'active' : '' }}">
                <span>📋</span> My Visitor Logs
            </a>
            <a href="{{ route('prisoners.index') }}" class="nav-link {{ request()->routeIs('prisoners.*') ? 'active' : '' }}">
                <span>🔍</span> Search Prisoner
            </a>
            <a href="{{ route('visitors.today') }}" class="nav-link {{ request()->routeIs('visitors.today') ? 'active' : '' }}">
                <span>📅</span> Today's Visitors
            </a>
        @endif
    </nav>

    <form method="POST" action="{{ route('logout') }}" class="logout-form">
        @csrf
        <button type="submit" class="nav-link logout-btn">
            <span>🚪</span> Logout
        </button>
    </form>
</aside>
```

---

## Step 6: Create Visitor CSS

**File:** `public/css/visitors.css`

```css
/* ========== ALERTS ========== */
.alert {
    padding: 15px 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 14px;
}

.alert-success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.alert-error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.alert ul {
    margin: 0;
    padding-left: 20px;
}

/* ========== HEADER ACTIONS ========== */
.header-actions {
    display: flex;
    gap: 10px;
}

/* ========== FILTER FORM ========== */
.filter-form {
    margin-bottom: 0;
}

.filter-group {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.filter-group input,
.filter-group select {
    padding: 10px 15px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
}

.filter-group input[type="text"] {
    flex: 2;
    min-width: 250px;
}

.filter-group input[type="date"],
.filter-group select {
    flex: 1;
    min-width: 150px;
}

/* ========== BADGES ========== */
.badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
}

.badge-success {
    background: #d4edda;
    color: #155724;
}

.badge-warning {
    background: #fff3cd;
    color: #856404;
}

/* ========== ACTION BUTTONS ========== */
.action-buttons {
    display: flex;
    gap: 5px;
}

.btn-icon {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    padding: 5px;
    transition: transform 0.2s;
}

.btn-icon:hover {
    transform: scale(1.2);
}

.btn-icon.btn-danger:hover {
    filter: brightness(0.8);
}

/* ========== VISITOR FORM ========== */
.visitor-form {
    max-width: 800px;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #2c3e50;
    font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 12px 15px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.required {
    color: #e74c3c;
}

.form-actions {
    display: flex;
    gap: 10px;
    margin-top: 30px;
}

/* ========== BUTTONS ========== */
.btn {
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
    transition: all 0.3s ease;
}

.btn-primary {
    background: #3498db;
    color: white;
}

.btn-primary:hover {
    background: #2980b9;
}

.btn-secondary {
    background: #95a5a6;
    color: white;
}

.btn-secondary:hover {
    background: #7f8c8d;
}

.btn-light {
    background: #ecf0f1;
    color: #2c3e50;
}

.btn-light:hover {
    background: #bdc3c7;
}

/* ========== PAGINATION ========== */
.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: center;
}

/* ========== DETAIL VIEW ========== */
.detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 25px;
}

.detail-item {
    border-bottom: 1px solid #eee;
    padding-bottom: 15px;
}

.detail-item.full-width {
    grid-column: 1 / -1;
}

.detail-item label {
    display: block;
    font-size: 12px;
    color: #666;
    margin-bottom: 5px;
    text-transform: uppercase;
    font-weight: 600;
}

.detail-item p {
    font-size: 16px;
    color: #2c3e50;
    margin: 0;
}

.detail-item small {
    color: #666;
    font-size: 13px;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
    .form-row {
        grid-template-columns: 1fr;
    }
    
    .detail-grid {
        grid-template-columns: 1fr;
    }
    
    .filter-group {
        flex-direction: column;
    }
    
    .filter-group input,
    .filter-group select {
        width: 100%;
    }
}
```

---

## Step 7: Update Dashboard Views with Visitor Links

Update the officer and admin dashboards to include links to visitors:

**Update:** `resources/views/officer/dashboard.blade.php`

Replace the visitor logs section:

```blade
<!-- Recent Visitor Logs -->
<div class="content-card">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2>Recent Visitor Logs</h2>
        <a href="{{ route('visitors.index') }}" class="btn btn-secondary">View All</a>
    </div>
    
    @if($myVisitorLogs && $myVisitorLogs->count() > 0)
        <table class="data-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Visitor Name</th>
                    <th>Prisoner</th>
                    <th>Time</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach($myVisitorLogs as $log)
                <tr>
                    <td>{{ $log->visit_date->format('M d, Y') }}</td>
                    <td>{{ $log->visitor_name }}</td>
                    <td>{{ $log->prisoner->full_name ?? 'N/A' }}</td>
                    <td>{{ \Carbon\Carbon::parse($log->visit_time)->format('h:i A') }}</td>
                    <td>
                        @if($log->checkout_time)
                            <span class="badge badge-success">Checked Out</span>
                        @else
                            <span class="badge badge-warning">Inside</span>
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p class="no-data">No visitor logs yet. <a href="{{ route('visitors.create') }}">Start logging visitors!</a></p>
    @endif
</div>
```

---

## Step 8: Create Seed Data for Testing

### Create Prisoner Seeder

```bash
php artisan make:seeder PrisonerSeeder
```

**File:** `database/seeders/PrisonerSeeder.php`

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Prisoner;

class PrisonerSeeder extends Seeder
{
    public function run(): void
    {
        $prisoners = [
            [
                'prisoner_number' => 'P-2024-001',
                'first_name' => 'Juan',
                'last_name' => 'Dela Cruz',
                'middle_name' => 'Santos',
                'date_of_birth' => '1990-05-15',
                'status' => 'active',
                'remarks' => 'Good behavior',
            ],
            [
                'prisoner_number' => 'P-2024-002',
                'first_name' => 'Maria',
                'last_name' => 'Garcia',
                'middle_name' => 'Lopez',
                'date_of_birth' => '1985-08-22',
                'status' => 'active',
                'remarks' => null,
            ],
            [
                'prisoner_number' => 'P-2024-003',
                'first_name' => 'Pedro',
                'last_name' => 'Reyes',
                'middle_name' => 'Cruz',
                'date_of_birth' => '1992-03-10',
                'status' => 'active',
                'remarks' => null,
            ],
        ];

        foreach ($prisoners as $prisoner) {
            Prisoner::create($prisoner);
        }
    }
}
```

**Run the seeder:**
```bash
php artisan db:seed --class=PrisonerSeeder
```

---

## Step 9: Test the System

### 1. Start the server
```bash
php artisan serve
```

### 2. Login as Officer
- Username: `officer1`
- Password: `officer123`

### 3. Test Features:
✅ Click "Log Visitor" - Fill out the form
✅ View visitor list
✅ Search visitors
✅ Edit a visitor
✅ Check out a visitor
✅ View visitor details

---

## Summary - What We Built:

✅ **Complete CRUD for Visitors**
   - Create (Log new visitor)
   - Read (View list & details)
   - Update (Edit visitor info)
   - Delete (Remove visitor log)

✅ **Search & Filter**
   - By visitor name
   - By date
   - By prisoner

✅ **Check-in/Check-out System**
   - Track when visitors enter
   - Track when visitors leave
   - Show who's still inside

✅ **Professional UI**
   - Clean forms
   - Data tables
   - Action buttons
   - Responsive design

✅ **Access Control**
   - Officers can log visitors
   - Admins can see all logs
   - Officers see only their logs (optional)

---

## Next Steps Available:

1. **Prisoner Management Module** (Add/Edit prisoners)
2. **Reports & Analytics** (Daily/Monthly visitor reports)
3. **Dashboard Statistics** (Real-time visitor counts)
4. **Export to Excel/PDF**

Your Visitor Logging System is now **100% functional**! 🎉
