<?php

namespace App\Controller;

use App\Service\TaskApiClient;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Session\SessionInterface;
use Symfony\Component\Routing\Annotation\Route;

class DashboardController extends AbstractController
{
    private TaskApiClient $apiClient;

    public function __construct(TaskApiClient $apiClient)
    {
        $this->apiClient = $apiClient;
    }

    #[Route('/dashboard', name: 'admin_dashboard')]
    public function index(SessionInterface $session): Response
    {
        // Check if user is authenticated and is admin
        $user = $session->get('admin_user');
        $token = $session->get('api_token');

        if (!$user || !$token || $user['role'] !== 'admin') {
            return $this->redirectToRoute('login');
        }

        // Set the auth token for API calls
        $this->apiClient->setAuthToken($token);

        // Validate the token before proceeding
        if (!$this->apiClient->validateToken()) {
            $session->remove('admin_user');
            $session->remove('api_token');
            $this->addFlash('error', 'Your session has expired. Please log in again.');
            return $this->redirectToRoute('login');
        }

        try {
            // Get data from API
            $tasks = $this->apiClient->getTasks();

            return $this->render('dashboard/index.html.twig', [
                'user' => $user,
                'tasks' => $tasks,
            ]);
        } catch (\Exception $e) {
            // Show the dashboard with an error message
            $this->addFlash('error', 'Failed to load dashboard data: ' . $e->getMessage());
            return $this->render('dashboard/index.html.twig', [
                'tasks' => [],
            ]);
        }
    }
}
