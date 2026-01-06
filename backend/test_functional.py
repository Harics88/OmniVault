"""
MyTasker Functional Testing Script
Tests all critical workflows and features
"""

import asyncio
import aiohttp
from datetime import datetime, date
import json

BASE_URL = "http://localhost:8000"

class TestResults:
    def __init__(self):
        self.passed = []
        self.failed = []
        self.warnings = []
    
    def add_pass(self, test_name):
        self.passed.append(test_name)
        print(f"✅ PASS: {test_name}")
    
    def add_fail(self, test_name, error):
        self.failed.append((test_name, error))
        print(f"❌ FAIL: {test_name} - {error}")
    
    def add_warning(self, test_name, message):
        self.warnings.append((test_name, message))
        print(f"⚠️  WARN: {test_name} - {message}")
    
    def summary(self):
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {len(self.passed)}")
        print(f"❌ Failed: {len(self.failed)}")
        print(f"⚠️  Warnings: {len(self.warnings)}")
        
        if self.failed:
            print("\nFailed Tests:")
            for test, error in self.failed:
                print(f"  - {test}: {error}")
        
        if self.warnings:
            print("\nWarnings:")
            for test, msg in self.warnings:
                print(f"  - {test}: {msg}")
        
        print("=" * 60)
        return len(self.failed) == 0

results = TestResults()

async def test_health_check(session):
    """Test health check endpoint"""
    try:
        async with session.get(f"{BASE_URL}/api/health") as resp:
            if resp.status == 200:
                data = await resp.json()
                if data.get("status") == "healthy":
                    results.add_pass("Health Check")
                else:
                    results.add_fail("Health Check", f"Status: {data.get('status')}")
            else:
                results.add_fail("Health Check", f"HTTP {resp.status}")
    except Exception as e:
        results.add_fail("Health Check", str(e))

async def test_tasks_crud(session):
    """Test Tasks CRUD operations"""
    task_id = None
    
    try:
        # Create task
        task_data = {
            "title": "Test Task",
            "status": "not_started",
            "priority": "medium"
        }
        async with session.post(f"{BASE_URL}/api/tasks", json=task_data) as resp:
            if resp.status == 200:
                task = await resp.json()
                task_id = task["id"]
                results.add_pass("Tasks - Create")
            else:
                results.add_fail("Tasks - Create", f"HTTP {resp.status}")
                return
        
        # Read task
        async with session.get(f"{BASE_URL}/api/tasks/{task_id}") as resp:
            if resp.status == 200:
                results.add_pass("Tasks - Read")
            else:
                results.add_fail("Tasks - Read", f"HTTP {resp.status}")
        
        # Update task
        update_data = {"title": "Updated Test Task", "status": "in_progress"}
        async with session.put(f"{BASE_URL}/api/tasks/{task_id}", json=update_data) as resp:
            if resp.status == 200:
                results.add_pass("Tasks - Update")
            else:
                results.add_fail("Tasks - Update", f"HTTP {resp.status}")
        
        # Delete task
        async with session.delete(f"{BASE_URL}/api/tasks/{task_id}") as resp:
            if resp.status == 200:
                results.add_pass("Tasks - Delete")
            else:
                results.add_fail("Tasks - Delete", f"HTTP {resp.status}")
                
    except Exception as e:
        results.add_fail("Tasks CRUD", str(e))

async def test_notes_crud(session):
    """Test Notes CRUD operations"""
    note_id = None
    
    try:
        # Create note
        note_data = {
            "title": "Test Note",
            "content": "Test content"
        }
        async with session.post(f"{BASE_URL}/api/notes", json=note_data) as resp:
            if resp.status == 200:
                note = await resp.json()
                note_id = note["id"]
                results.add_pass("Notes - Create")
            else:
                results.add_fail("Notes - Create", f"HTTP {resp.status}")
                return
        
        # Read note
        async with session.get(f"{BASE_URL}/api/notes/{note_id}") as resp:
            if resp.status == 200:
                results.add_pass("Notes - Read")
            else:
                results.add_fail("Notes - Read", f"HTTP {resp.status}")
        
        # Update note
        update_data = {"title": "Updated Test Note"}
        async with session.put(f"{BASE_URL}/api/notes/{note_id}", json=update_data) as resp:
            if resp.status == 200:
                results.add_pass("Notes - Update")
            else:
                results.add_fail("Notes - Update", f"HTTP {resp.status}")
        
        # Soft delete note
        async with session.delete(f"{BASE_URL}/api/notes/{note_id}") as resp:
            if resp.status == 200:
                results.add_pass("Notes - Soft Delete")
            else:
                results.add_fail("Notes - Soft Delete", f"HTTP {resp.status}")
        
        # Restore note
        async with session.post(f"{BASE_URL}/api/notes/{note_id}/restore") as resp:
            if resp.status == 200:
                results.add_pass("Notes - Restore")
            else:
                results.add_fail("Notes - Restore", f"HTTP {resp.status}")
        
        # Permanent delete
        async with session.delete(f"{BASE_URL}/api/notes/{note_id}/permanent") as resp:
            if resp.status == 200:
                results.add_pass("Notes - Permanent Delete")
            else:
                results.add_fail("Notes - Permanent Delete", f"HTTP {resp.status}")
                
    except Exception as e:
        results.add_fail("Notes CRUD", str(e))

async def test_snippets_crud(session):
    """Test Snippets CRUD operations"""
    snippet_id = None
    
    try:
        # Create snippet
        snippet_data = {
            "title": "Test Snippet",
            "code": "print('Hello, World!')",
            "language": "python"
        }
        async with session.post(f"{BASE_URL}/api/snippets", json=snippet_data) as resp:
            if resp.status == 200:
                snippet = await resp.json()
                snippet_id = snippet["id"]
                results.add_pass("Snippets - Create")
            else:
                results.add_fail("Snippets - Create", f"HTTP {resp.status}")
                return
        
        # Read snippet
        async with session.get(f"{BASE_URL}/api/snippets/{snippet_id}") as resp:
            if resp.status == 200:
                results.add_pass("Snippets - Read")
            else:
                results.add_fail("Snippets - Read", f"HTTP {resp.status}")
        
        # Update snippet
        update_data = {"title": "Updated Test Snippet"}
        async with session.put(f"{BASE_URL}/api/snippets/{snippet_id}", json=update_data) as resp:
            if resp.status == 200:
                results.add_pass("Snippets - Update")
            else:
                results.add_fail("Snippets - Update", f"HTTP {resp.status}")
        
        # Delete snippet
        async with session.delete(f"{BASE_URL}/api/snippets/{snippet_id}") as resp:
            if resp.status == 200:
                results.add_pass("Snippets - Delete")
            else:
                results.add_fail("Snippets - Delete", f"HTTP {resp.status}")
                
    except Exception as e:
        results.add_fail("Snippets CRUD", str(e))

async def test_search(session):
    """Test global search"""
    try:
        async with session.get(f"{BASE_URL}/api/search?q=test") as resp:
            if resp.status == 200:
                results.add_pass("Global Search")
            else:
                results.add_fail("Global Search", f"HTTP {resp.status}")
    except Exception as e:
        results.add_fail("Global Search", str(e))

async def test_system_stats(session):
    """Test system stats endpoint"""
    try:
        async with session.get(f"{BASE_URL}/api/system/stats") as resp:
            if resp.status == 200:
                data = await resp.json()
                if all(k in data for k in ["tasks", "notes", "snippets", "bookmarks"]):
                    results.add_pass("System Stats")
                else:
                    results.add_fail("System Stats", "Missing expected fields")
            else:
                results.add_fail("System Stats", f"HTTP {resp.status}")
    except Exception as e:
        results.add_fail("System Stats", str(e))

async def test_daily_log(session):
    """Test daily log operations"""
    try:
        today = date.today().isoformat()
        
        # Get today's log
        async with session.get(f"{BASE_URL}/api/daily-logs/today") as resp:
            if resp.status in [200, 404]:  # 404 is ok if no log exists yet
                results.add_pass("Daily Log - Get Today")
            else:
                results.add_fail("Daily Log - Get Today", f"HTTP {resp.status}")
        
        # Update today's log
        log_data = {"content": "Test daily log content"}
        async with session.put(f"{BASE_URL}/api/daily-logs/date/{today}", json=log_data) as resp:
            if resp.status == 200:
                results.add_pass("Daily Log - Update")
            else:
                results.add_fail("Daily Log - Update", f"HTTP {resp.status}")
                
    except Exception as e:
        results.add_fail("Daily Log", str(e))

async def run_all_tests():
    """Run all functional tests"""
    print("=" * 60)
    print("MyTasker Functional Testing")
    print("=" * 60)
    print(f"Testing against: {BASE_URL}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print()
    
    async with aiohttp.ClientSession() as session:
        # Test health check first
        await test_health_check(session)
        
        if not results.failed:
            # Run all other tests
            await test_tasks_crud(session)
            await test_notes_crud(session)
            await test_snippets_crud(session)
            await test_search(session)
            await test_system_stats(session)
            await test_daily_log(session)
        else:
            print("\n⚠️  Skipping remaining tests due to health check failure")
    
    # Print summary
    success = results.summary()
    
    print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return 0 if success else 1

if __name__ == "__main__":
    import sys
    exit_code = asyncio.run(run_all_tests())
    sys.exit(exit_code)
