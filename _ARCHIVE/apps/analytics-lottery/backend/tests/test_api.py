"""
ADJ KILLAGAIN IA 2.0 - Backend API Tests
Tests for all critical API endpoints
"""

import pytest
import requests
import os

# Use the public URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://app-builder-free-11.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "adjudan97one.ly@gmail.com"
TEST_PASSWORD = "LorenZ971972@"


class TestHealthEndpoints:
    """Test basic API health"""
    
    def test_root_endpoint(self):
        """Test root API endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Hello World"
        print("✅ Root endpoint working")


class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        print(f"✅ Login successful for {TEST_EMAIL}")
        return data["access_token"]
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "invalid@email.com", "password": "wrongpassword"}
        )
        assert response.status_code in [401, 500]  # Should return unauthorized
        print("✅ Invalid login correctly rejected")
    
    def test_verify_token(self):
        """Test token verification"""
        # First login to get token
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        token = login_response.json()["access_token"]
        
        # Verify the token
        response = requests.post(
            f"{BASE_URL}/api/auth/verify",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        print("✅ Token verification working")
    
    def test_get_current_user(self):
        """Test getting current user info"""
        # First login to get token
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        token = login_response.json()["access_token"]
        
        # Get current user
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_EMAIL
        print("✅ Get current user working")


class TestProjects:
    """Test project endpoints"""
    
    def test_get_available_models(self):
        """Test getting available AI models"""
        response = requests.get(f"{BASE_URL}/api/projects/models")
        assert response.status_code == 200
        data = response.json()
        assert "models" in data
        assert len(data["models"]) > 0
        print(f"✅ Available models: {len(data['models'])} models found")
    
    def test_get_projects_list(self):
        """Test getting projects list"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Projects list: {len(data)} projects found")


class TestWebScraper:
    """Test web scraper endpoints"""
    
    def test_scraper_test_endpoint(self):
        """Test the scraper test endpoint"""
        response = requests.get(f"{BASE_URL}/api/scraper/test")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        print(f"✅ Scraper test: {data.get('message', 'working')}")
    
    def test_scrape_single_url(self):
        """Test scraping a single URL"""
        response = requests.post(
            f"{BASE_URL}/api/scraper/scrape",
            json={"url": "https://example.com", "extract_type": "text"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "success"
        print("✅ Single URL scraping working")


class TestVoiceCommands:
    """Test voice command endpoints"""
    
    def test_get_voice_commands(self):
        """Test getting available voice commands"""
        response = requests.get(f"{BASE_URL}/api/chat/voice-commands")
        assert response.status_code == 200
        data = response.json()
        assert "commands" in data
        assert "examples" in data
        print(f"✅ Voice commands: {len(data.get('commands', []))} commands available")
    
    def test_process_voice_command(self):
        """Test processing a voice command"""
        response = requests.post(
            f"{BASE_URL}/api/chat/voice-command",
            json={"voice_input": "Aide moi", "project_id": None}
        )
        assert response.status_code == 200
        data = response.json()
        assert "action" in data or "is_command" in data
        print("✅ Voice command processing working")


class TestProjectCreation:
    """Test project creation with validation errors"""
    
    def test_create_project_missing_fields(self):
        """Test that project creation validates required fields"""
        response = requests.post(
            f"{BASE_URL}/api/projects",
            json={"name": "Test"}  # Missing required fields
        )
        # Should return validation error
        assert response.status_code == 422
        print("✅ Project creation validation working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
