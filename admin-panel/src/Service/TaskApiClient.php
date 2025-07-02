<?php

namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;

class TaskApiClient
{
    private HttpClientInterface $httpClient;
    private string $apiBaseUrl;
    private ?string $authToken = null;

    public function __construct(HttpClientInterface $httpClient, string $apiBaseUrl)
    {
        $this->httpClient = $httpClient;
        $this->apiBaseUrl = $apiBaseUrl;
    }

    public function setAuthToken(?string $token): void
    {
        $this->authToken = $token;
    }

    public function validateToken(): bool
    {
        if (!$this->authToken) {
            return false;
        }

        try {
            $response = $this->httpClient->request('GET', $this->apiBaseUrl . '/auth/validate', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->authToken,
                    'Content-Type' => 'application/json'
                ]
            ]);

            $statusCode = $response->getStatusCode();
            if ($statusCode === 200) {
                $data = $response->toArray();
                return isset($data['valid']) && $data['valid'] === true;
            }
            return false;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function authenticate(string $email, string $password): array
    {
        try {
            $response = $this->httpClient->request('POST', $this->apiBaseUrl . '/auth/login', [
                'json' => [
                    'email' => $email,
                    'password' => $password
                ]
            ]);

            $statusCode = $response->getStatusCode();

            if ($statusCode >= 400) {
                $errorContent = $response->getContent(false);
                throw new \Exception('Authentication failed with status ' . $statusCode . ': ' . $errorContent);
            }

            $data = $response->toArray();
            $this->authToken = $data['token'] ?? null;
            
            return $data;
        } catch (\Exception $e) {
            throw new \Exception('Authentication failed: ' . $e->getMessage());
        }
    }

    public function getTasks(): array
    {
        return $this->makeAuthenticatedRequest('GET', '/tasks');
    }

    public function getTask(int $taskId): array
    {
        return $this->makeAuthenticatedRequest('GET', '/tasks/' . $taskId);
    }

    public function getUsers(): array
    {
        return $this->makeAuthenticatedRequest('GET', '/users');
    }

    public function createTask(array $taskData): array
    {
        return $this->makeAuthenticatedRequest('POST', '/tasks', $taskData);
    }

    public function updateTask(int $taskId, array $taskData): array
    {
        return $this->makeAuthenticatedRequest('PUT', '/tasks/' . $taskId, $taskData);
    }

    public function deleteTask(int $taskId): array
    {
        return $this->makeAuthenticatedRequest('DELETE', '/tasks/' . $taskId);
    }

    public function completeTask(int $taskId): array
    {
        return $this->makeAuthenticatedRequest('PATCH', '/tasks/' . $taskId . '/complete');
    }

    private function makeAuthenticatedRequest(string $method, string $endpoint, array $data = []): array
    {
        if (!$this->authToken) {
            throw new \Exception('Authentication token not set');
        }

        try {
            $options = [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->authToken,
                    'Content-Type' => 'application/json'
                ]
            ];

            if (!empty($data)) {
                $options['json'] = $data;
            }
                
            $response = $this->httpClient->request($method, $this->apiBaseUrl . $endpoint, $options);
            
            $statusCode = $response->getStatusCode();
            
            if ($statusCode >= 400) {
                $errorContent = $response->getContent(false);
                throw new \Exception('API request failed with status ' . $statusCode . ': ' . $errorContent);
            }
            
            return $response->toArray();
        } catch (\Exception $e) {
            throw new \Exception('API request failed: ' . $e->getMessage());
        }
    }
}
