#!/usr/bin/env python3
"""
CodeForge AI Backend API Testing
Tests all backend endpoints for the CodeForge AI application
"""

import asyncio
import aiohttp
import json
import sys
import os
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://app-builder-free-11.preview.emergentagent.com/api"

class CodeForgeAPITester:
    def __init__(self):
        self.session = None
        self.test_project_id = None
        self.test_results = []
        
    async def setup(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=60),  # 60 seconds timeout
            headers={"Content-Type": "application/json"}
        )
    
    async def cleanup(self):
        """Clean up resources"""
        if self.session:
            await self.session.close()
    
    async def test_root_endpoint(self):
        """Test GET /api/ endpoint"""
        print("\n" + "="*60)
        print("TEST 1: Root API Endpoint (GET /api/)")
        print("="*60)
        
        try:
            url = f"{BACKEND_URL}/"
            print(f"Testing URL: {url}")
            
            async with self.session.get(url) as response:
                status_code = response.status
                content = await response.text()
                
                print(f"Status Code: {status_code}")
                print(f"Response: {content}")
                
                if status_code == 200:
                    try:
                        json_response = json.loads(content)
                        if json_response.get("message") == "Hello World":
                            print("✅ PASS: Root endpoint working correctly")
                            self.test_results.append(("Root API endpoint", True, "Working correctly"))
                            return True
                        else:
                            print(f"❌ FAIL: Unexpected response content: {json_response}")
                            self.test_results.append(("Root API endpoint", False, f"Unexpected response: {json_response}"))
                            return False
                    except json.JSONDecodeError:
                        print(f"❌ FAIL: Invalid JSON response: {content}")
                        self.test_results.append(("Root API endpoint", False, f"Invalid JSON: {content}"))
                        return False
                else:
                    print(f"❌ FAIL: Unexpected status code: {status_code}")
                    self.test_results.append(("Root API endpoint", False, f"Status {status_code}: {content}"))
                    return False
                    
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
            self.test_results.append(("Root API endpoint", False, f"Error: {str(e)}"))
            return False
    
    async def test_create_project(self):
        """Test POST /api/projects endpoint with AI code generation"""
        print("\n" + "="*60)
        print("TEST 2: Create Project with AI Code Generation (POST /api/projects)")
        print("="*60)
        
        try:
            url = f"{BACKEND_URL}/projects"
            print(f"Testing URL: {url}")
            
            # Test data as specified in the review request
            project_data = {
                "name": "Test Recipe App",
                "description": "Une application qui prend une photo d'ingrédients et suggère des recettes. Utilise l'IA pour identifier les ingrédients.",
                "type": "ai-app",
                "tech_stack": "React, FastAPI, OpenAI"
            }
            
            print(f"Request body: {json.dumps(project_data, indent=2)}")
            print("⏳ This may take 10-30 seconds due to AI code generation...")
            
            start_time = time.time()
            async with self.session.post(url, json=project_data) as response:
                end_time = time.time()
                duration = end_time - start_time
                
                status_code = response.status
                content = await response.text()
                
                print(f"Status Code: {status_code}")
                print(f"Duration: {duration:.2f} seconds")
                
                if status_code == 200:
                    try:
                        json_response = json.loads(content)
                        
                        # Verify required fields
                        required_fields = ['id', 'name', 'description', 'type', 'tech_stack', 'status', 'created_at']
                        missing_fields = [field for field in required_fields if field not in json_response]
                        
                        if missing_fields:
                            print(f"❌ FAIL: Missing required fields: {missing_fields}")
                            self.test_results.append(("Create project with AI code generation", False, f"Missing fields: {missing_fields}"))
                            return False
                        
                        # Store project ID for later tests
                        self.test_project_id = json_response['id']
                        print(f"✅ Project created with ID: {self.test_project_id}")
                        
                        # Verify status is "completed"
                        if json_response['status'] != 'completed':
                            print(f"⚠️  WARNING: Project status is '{json_response['status']}', expected 'completed'")
                        
                        # Check code_files
                        code_files = json_response.get('code_files', [])
                        if not code_files:
                            print("❌ FAIL: No code files generated")
                            self.test_results.append(("Create project with AI code generation", False, "No code files generated"))
                            return False
                        
                        print(f"✅ Code files generated: {len(code_files)} files")
                        
                        # Verify code files structure
                        for i, file in enumerate(code_files):
                            if not all(key in file for key in ['filename', 'language', 'content']):
                                print(f"❌ FAIL: Code file {i} missing required fields")
                                self.test_results.append(("Create project with AI code generation", False, f"Code file {i} missing fields"))
                                return False
                            
                            if not file['content'] or file['content'].strip() == "":
                                print(f"❌ FAIL: Code file {i} ({file['filename']}) has empty content")
                                self.test_results.append(("Create project with AI code generation", False, f"Empty content in {file['filename']}"))
                                return False
                            
                            print(f"  - {file['filename']} ({file['language']}): {len(file['content'])} characters")
                        
                        print("✅ PASS: Project created successfully with AI-generated code")
                        self.test_results.append(("Create project with AI code generation", True, f"Created with {len(code_files)} code files"))
                        return True
                        
                    except json.JSONDecodeError:
                        print(f"❌ FAIL: Invalid JSON response: {content}")
                        self.test_results.append(("Create project with AI code generation", False, f"Invalid JSON: {content}"))
                        return False
                else:
                    print(f"❌ FAIL: Unexpected status code: {status_code}")
                    print(f"Response: {content}")
                    self.test_results.append(("Create project with AI code generation", False, f"Status {status_code}: {content}"))
                    return False
                    
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
            self.test_results.append(("Create project with AI code generation", False, f"Error: {str(e)}"))
            return False
    
    async def test_list_projects(self):
        """Test GET /api/projects endpoint"""
        print("\n" + "="*60)
        print("TEST 3: List All Projects (GET /api/projects)")
        print("="*60)
        
        try:
            url = f"{BACKEND_URL}/projects"
            print(f"Testing URL: {url}")
            
            async with self.session.get(url) as response:
                status_code = response.status
                content = await response.text()
                
                print(f"Status Code: {status_code}")
                
                if status_code == 200:
                    try:
                        json_response = json.loads(content)
                        
                        if not isinstance(json_response, list):
                            print(f"❌ FAIL: Expected list, got {type(json_response)}")
                            self.test_results.append(("List all projects", False, f"Expected list, got {type(json_response)}"))
                            return False
                        
                        print(f"✅ PASS: Retrieved {len(json_response)} projects")
                        
                        # If we have projects, verify structure
                        if json_response:
                            project = json_response[0]
                            required_fields = ['id', 'name', 'description', 'type', 'tech_stack', 'status', 'created_at']
                            missing_fields = [field for field in required_fields if field not in project]
                            
                            if missing_fields:
                                print(f"⚠️  WARNING: Project missing fields: {missing_fields}")
                            else:
                                print("✅ Project structure is correct")
                        
                        self.test_results.append(("List all projects", True, f"Retrieved {len(json_response)} projects"))
                        return True
                        
                    except json.JSONDecodeError:
                        print(f"❌ FAIL: Invalid JSON response: {content}")
                        self.test_results.append(("List all projects", False, f"Invalid JSON: {content}"))
                        return False
                else:
                    print(f"❌ FAIL: Unexpected status code: {status_code}")
                    print(f"Response: {content}")
                    self.test_results.append(("List all projects", False, f"Status {status_code}: {content}"))
                    return False
                    
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
            self.test_results.append(("List all projects", False, f"Error: {str(e)}"))
            return False
    
    async def test_get_specific_project(self):
        """Test GET /api/projects/{project_id} endpoint"""
        print("\n" + "="*60)
        print("TEST 4: Get Specific Project (GET /api/projects/{project_id})")
        print("="*60)
        
        if not self.test_project_id:
            print("❌ FAIL: No project ID available from previous test")
            self.test_results.append(("Get specific project", False, "No project ID available"))
            return False
        
        try:
            url = f"{BACKEND_URL}/projects/{self.test_project_id}"
            print(f"Testing URL: {url}")
            print(f"Project ID: {self.test_project_id}")
            
            async with self.session.get(url) as response:
                status_code = response.status
                content = await response.text()
                
                print(f"Status Code: {status_code}")
                
                if status_code == 200:
                    try:
                        json_response = json.loads(content)
                        
                        # Verify required fields
                        required_fields = ['id', 'name', 'description', 'type', 'tech_stack', 'status', 'created_at']
                        missing_fields = [field for field in required_fields if field not in json_response]
                        
                        if missing_fields:
                            print(f"❌ FAIL: Missing required fields: {missing_fields}")
                            self.test_results.append(("Get specific project", False, f"Missing fields: {missing_fields}"))
                            return False
                        
                        # Verify it's the correct project
                        if json_response['id'] != self.test_project_id:
                            print(f"❌ FAIL: Wrong project ID returned")
                            self.test_results.append(("Get specific project", False, "Wrong project ID returned"))
                            return False
                        
                        # Check code_files
                        code_files = json_response.get('code_files', [])
                        print(f"✅ Project details retrieved with {len(code_files)} code files")
                        
                        print("✅ PASS: Specific project retrieved successfully")
                        self.test_results.append(("Get specific project", True, f"Retrieved project with {len(code_files)} files"))
                        return True
                        
                    except json.JSONDecodeError:
                        print(f"❌ FAIL: Invalid JSON response: {content}")
                        self.test_results.append(("Get specific project", False, f"Invalid JSON: {content}"))
                        return False
                elif status_code == 404:
                    print("❌ FAIL: Project not found")
                    self.test_results.append(("Get specific project", False, "Project not found"))
                    return False
                else:
                    print(f"❌ FAIL: Unexpected status code: {status_code}")
                    print(f"Response: {content}")
                    self.test_results.append(("Get specific project", False, f"Status {status_code}: {content}"))
                    return False
                    
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
            self.test_results.append(("Get specific project", False, f"Error: {str(e)}"))
            return False
    
    async def test_delete_project(self):
        """Test DELETE /api/projects/{project_id} endpoint"""
        print("\n" + "="*60)
        print("TEST 5: Delete Project (DELETE /api/projects/{project_id})")
        print("="*60)
        
        if not self.test_project_id:
            print("❌ FAIL: No project ID available from previous test")
            self.test_results.append(("Delete project", False, "No project ID available"))
            return False
        
        try:
            url = f"{BACKEND_URL}/projects/{self.test_project_id}"
            print(f"Testing URL: {url}")
            print(f"Project ID: {self.test_project_id}")
            
            async with self.session.delete(url) as response:
                status_code = response.status
                content = await response.text()
                
                print(f"Status Code: {status_code}")
                print(f"Response: {content}")
                
                if status_code == 200:
                    try:
                        json_response = json.loads(content)
                        if "message" in json_response and "succès" in json_response["message"].lower():
                            print("✅ PASS: Project deleted successfully")
                            self.test_results.append(("Delete project", True, "Project deleted successfully"))
                            return True
                        else:
                            print(f"❌ FAIL: Unexpected response: {json_response}")
                            self.test_results.append(("Delete project", False, f"Unexpected response: {json_response}"))
                            return False
                    except json.JSONDecodeError:
                        print(f"❌ FAIL: Invalid JSON response: {content}")
                        self.test_results.append(("Delete project", False, f"Invalid JSON: {content}"))
                        return False
                elif status_code == 404:
                    print("❌ FAIL: Project not found")
                    self.test_results.append(("Delete project", False, "Project not found"))
                    return False
                else:
                    print(f"❌ FAIL: Unexpected status code: {status_code}")
                    self.test_results.append(("Delete project", False, f"Status {status_code}: {content}"))
                    return False
                    
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
            self.test_results.append(("Delete project", False, f"Error: {str(e)}"))
            return False
    
    async def run_all_tests(self):
        """Run all tests in sequence"""
        print("="*80)
        print("CODEFORGE AI BACKEND API TESTING")
        print("="*80)
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Test started at: {datetime.now().isoformat()}")
        
        await self.setup()
        
        # Run tests in sequence
        test_results = []
        test_results.append(await self.test_root_endpoint())
        test_results.append(await self.test_create_project())
        test_results.append(await self.test_list_projects())
        test_results.append(await self.test_get_specific_project())
        test_results.append(await self.test_delete_project())
        
        await self.cleanup()
        
        # Print summary
        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)
        
        passed = sum(1 for result in test_results if result)
        total = len(test_results)
        
        for test_name, success, details in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"{status}: {test_name} - {details}")
        
        print("-" * 80)
        print(f"OVERALL RESULT: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED! Backend API is working correctly.")
            return True
        else:
            print(f"⚠️  {total - passed} test(s) failed. See details above.")
            return False

async def main():
    """Main function"""
    tester = CodeForgeAPITester()
    success = await tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\nTesting interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nUnexpected error: {str(e)}")
        sys.exit(1)