#!/usr/bin/env python3
"""
Quick Backend API Test for CodeForge AI
"""

import requests
import json
import time
from datetime import datetime

BACKEND_URL = "https://app-builder-free-11.preview.emergentagent.com/api"

def test_api():
    print("="*60)
    print("QUICK BACKEND API TEST")
    print("="*60)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Started at: {datetime.now().isoformat()}")
    
    results = []
    
    # Test 1: Root endpoint
    print("\n1. Testing GET /api/")
    try:
        response = requests.get(f"{BACKEND_URL}/", timeout=10)
        if response.status_code == 200 and response.json().get("message") == "Hello World":
            print("✅ PASS: Root endpoint working")
            results.append(("Root endpoint", True))
        else:
            print(f"❌ FAIL: Status {response.status_code}, Response: {response.text}")
            results.append(("Root endpoint", False))
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        results.append(("Root endpoint", False))
    
    # Test 2: List projects
    print("\n2. Testing GET /api/projects")
    try:
        response = requests.get(f"{BACKEND_URL}/projects", timeout=10)
        if response.status_code == 200:
            projects = response.json()
            print(f"✅ PASS: Retrieved {len(projects)} projects")
            results.append(("List projects", True))
            
            # Store a project ID for testing
            project_id = None
            if projects:
                project_id = projects[0]['id']
                print(f"Found project ID: {project_id}")
            
        else:
            print(f"❌ FAIL: Status {response.status_code}, Response: {response.text}")
            results.append(("List projects", False))
            project_id = None
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        results.append(("List projects", False))
        project_id = None
    
    # Test 3: Get specific project (if we have an ID)
    if project_id:
        print(f"\n3. Testing GET /api/projects/{project_id}")
        try:
            response = requests.get(f"{BACKEND_URL}/projects/{project_id}", timeout=10)
            if response.status_code == 200:
                project = response.json()
                print(f"✅ PASS: Retrieved project '{project.get('name', 'Unknown')}'")
                results.append(("Get specific project", True))
            else:
                print(f"❌ FAIL: Status {response.status_code}, Response: {response.text}")
                results.append(("Get specific project", False))
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
            results.append(("Get specific project", False))
    else:
        print("\n3. SKIP: No project ID available for testing")
        results.append(("Get specific project", False))
    
    # Test 4: Create new project (quick test)
    print("\n4. Testing POST /api/projects (Create project)")
    project_data = {
        "name": "Quick Test Project",
        "description": "A simple test project to verify the API is working correctly and can generate code.",
        "type": "python-script",
        "tech_stack": "Python"
    }
    
    print("⏳ Creating project (this may take 10-30 seconds)...")
    try:
        response = requests.post(f"{BACKEND_URL}/projects", json=project_data, timeout=45)
        if response.status_code == 200:
            project = response.json()
            created_id = project.get('id')
            status = project.get('status')
            code_files = project.get('code_files', [])
            print(f"✅ PASS: Project created with ID {created_id}, status: {status}")
            print(f"Generated {len(code_files)} code files")
            results.append(("Create project", True))
            
            # Test 5: Delete the project we just created
            print(f"\n5. Testing DELETE /api/projects/{created_id}")
            try:
                delete_response = requests.delete(f"{BACKEND_URL}/projects/{created_id}", timeout=10)
                if delete_response.status_code == 200:
                    print("✅ PASS: Project deleted successfully")
                    results.append(("Delete project", True))
                else:
                    print(f"❌ FAIL: Status {delete_response.status_code}, Response: {delete_response.text}")
                    results.append(("Delete project", False))
            except Exception as e:
                print(f"❌ ERROR: {str(e)}")
                results.append(("Delete project", False))
                
        else:
            print(f"❌ FAIL: Status {response.status_code}, Response: {response.text}")
            results.append(("Create project", False))
            results.append(("Delete project", False))
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        results.append(("Create project", False))
        results.append(("Delete project", False))
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print("-" * 60)
    print(f"RESULT: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL BACKEND TESTS PASSED!")
    elif passed >= 3:
        print("✅ Core functionality working with minor issues")
    else:
        print("⚠️  Multiple test failures detected")
    
    return passed, total

if __name__ == "__main__":
    test_api()