<?php

namespace App\Controller;

use App\Service\TaskApiClient;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/tasks')]
class TaskController extends AbstractController
{
    private TaskApiClient $apiClient;

    public function __construct(TaskApiClient $apiClient)
    {
        $this->apiClient = $apiClient;
    }

    #[Route('/new', name: 'tasks_new', methods: ['GET'])]
    public function new(): Response
    {
        $session = $this->container->get('request_stack')->getCurrentRequest()->getSession();
        $user = $session->get('admin_user');
        $token = $session->get('api_token');

        if (!$user || !$token || $user['role'] !== 'admin') {
            return $this->redirectToRoute('login');
        }

         // Set the auth token for API calls
        $this->apiClient->setAuthToken($token);

        try {
            return $this->render('tasks/form.html.twig', [
                'task' => [],
                'users' => $this->apiClient->getUsers(),
                'errors' => [],
            ]);
        } catch (\Exception $e) {
            $this->addFlash('error', 'Failed to load form: ' . $e->getMessage());
            return $this->redirectToRoute('admin_dashboard');
        }
    }

    #[Route('/create', name: 'tasks_create', methods: ['POST'])]
    public function create(Request $request): Response
    {
        $session = $this->container->get('request_stack')->getCurrentRequest()->getSession();
        $user = $session->get('admin_user');
        $token = $session->get('api_token');

        if (!$user || !$token || $user['role'] !== 'admin') {
            return $this->redirectToRoute('login');
        }

        // Set the auth token for API calls
        $this->apiClient->setAuthToken($token);

        $data = [
            'title' => $request->request->get('title'),
            'description' => $request->request->get('description'),
            'status' => $request->request->get('status') ?: 'pending',
            'assignee' => $request->request->get('assignee') ?: null
        ];

        // Validate required fields
        $errors = [];
        if (empty($data['title'])) {
            $errors[] = 'Title is required';
        }

        if (!empty($errors)) {
            return $this->render('tasks/form.html.twig', [
                'task' => $data,
                'errors' => $errors,
            ]);
        }

        try {
            $this->apiClient->createTask($data);
            $this->addFlash('success', 'Task created successfully');
            return $this->redirectToRoute('admin_dashboard');
        } catch (\Exception $e) {
            $this->addFlash('error', 'Failed to create task: ' . $e->getMessage());
            
            return $this->render('tasks/form.html.twig', [
                'task' => $data,
                'errors' => ['Failed to create task: ' . $e->getMessage()],
            ]);
        }
    }

    #[Route('/{id}', name: 'tasks_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): Response
    {
        $session = $this->container->get('request_stack')->getCurrentRequest()->getSession();
        $user = $session->get('admin_user');
        $token = $session->get('api_token');

        if (!$user || !$token || $user['role'] !== 'admin') {
            return $this->redirectToRoute('login');
        }

        // Set the auth token for API calls
        $this->apiClient->setAuthToken($token);

        try {
            $task = $this->apiClient->getTask($id);

            return $this->render('tasks/show.html.twig', [
                'task' => $task,
            ]);
        } catch (\Exception $e) {
            $this->addFlash('error', 'Task not found: ' . $e->getMessage());
            return $this->redirectToRoute('admin_dashboard');
        }
    }

    #[Route('/{id}/edit', name: 'tasks_edit', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function edit(int $id): Response
    {
        $session = $this->container->get('request_stack')->getCurrentRequest()->getSession();
        $user = $session->get('admin_user');
        $token = $session->get('api_token');

        if (!$user || !$token || $user['role'] !== 'admin') {
            return $this->redirectToRoute('login');
        }

        // Set the auth token for API calls
        $this->apiClient->setAuthToken($token);

        try {

            return $this->render('tasks/form.html.twig', [
                'users' => $this->apiClient->getUsers(),
                'task' => $this->apiClient->getTask($id),
                'errors' => [],
            ]);
        } catch (\Exception $e) {
            $this->addFlash('error', 'Task not found: ' . $e->getMessage());
            return $this->redirectToRoute('admin_dashboard');
        }
    }

    #[Route('/{id}/update', name: 'tasks_update', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function update(Request $request, int $id): Response
    {
        $session = $this->container->get('request_stack')->getCurrentRequest()->getSession();
        $user = $session->get('admin_user');
        $token = $session->get('api_token');

        if (!$user || !$token || $user['role'] !== 'admin') {
            return $this->redirectToRoute('login');
        }

        // Set the auth token for API calls
        $this->apiClient->setAuthToken($token);

        $data = [
            'title' => $request->request->get('title'),
            'description' => $request->request->get('description'),
            'status' => $request->request->get('status') ?: 'pending',
        ];

        // Validate required fields
        $errors = [];
        if (empty($data['title'])) {
            $errors[] = 'Title is required';
        }

        if (!empty($errors)) {
            try {
                $task = $this->apiClient->getTask($id);
                return $this->render('tasks/form.html.twig', [
                    'task' => array_merge($task, $data),
                    'errors' => $errors,
                ]);
            } catch (\Exception $e) {
                $this->addFlash('error', 'Failed to load form: ' . $e->getMessage());
                return $this->redirectToRoute('admin_dashboard');
            }
        }

        try {
            $this->apiClient->updateTask($id, $data);
            $this->addFlash('success', 'Task updated successfully');
            return $this->redirectToRoute('tasks_show', ['id' => $id]);
        } catch (\Exception $e) {
            $this->addFlash('error', 'Failed to update task: ' . $e->getMessage());
            
            try {
                $task = $this->apiClient->getTask($id);
                return $this->render('tasks/form.html.twig', [
                    'task' => array_merge($task, $data),
                    'errors' => ['Failed to update task: ' . $e->getMessage()],
                ]);
            } catch (\Exception $e2) {
                return $this->redirectToRoute('admin_dashboard');
            }
        }
    }

    #[Route('/{id}/delete', name: 'tasks_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): Response
    {
        $session = $this->container->get('request_stack')->getCurrentRequest()->getSession();
        $user = $session->get('admin_user');
        $token = $session->get('api_token');

        if (!$user || !$token || $user['role'] !== 'admin') {
            return new JsonResponse(['error' => 'Unauthorized'], 401);
        }

        // Set the auth token for API calls
        $this->apiClient->setAuthToken($token);

        try {
            $this->apiClient->deleteTask($id);
            
            if ($this->isXmlHttpRequest()) {
                return new JsonResponse(['success' => true]);
            }
            
            $this->addFlash('success', 'Task deleted successfully');
            return $this->redirectToRoute('admin_dashboard');
        } catch (\Exception $e) {
            if ($this->isXmlHttpRequest()) {
                return new JsonResponse(['error' => $e->getMessage()], 400);
            }
            
            $this->addFlash('error', 'Failed to delete task: ' . $e->getMessage());
            return $this->redirectToRoute('admin_dashboard');
        }
    }

    private function getAdminUser(): ?array
    {
        $session = $this->container->get('request_stack')->getCurrentRequest()->getSession();
        return $session->get('admin_user');
    }

    private function isXmlHttpRequest(): bool
    {
        $request = $this->container->get('request_stack')->getCurrentRequest();
        return $request->headers->get('X-Requested-With') === 'XMLHttpRequest';
    }
}
