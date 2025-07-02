<?php

namespace App\Controller;

use App\Service\TaskApiClient;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Session\SessionInterface;
use Symfony\Component\Routing\Annotation\Route;

class SecurityController extends AbstractController
{
    private TaskApiClient $apiClient;

    public function __construct(TaskApiClient $apiClient)
    {
        $this->apiClient = $apiClient;
    }

    #[Route('/', name: 'homepage')]
    public function homepage(SessionInterface $session): Response
    {
        // Check if user is authenticated and is admin
        $user = $session->get('admin_user');
        $token = $session->get('api_token');
        
        if ($user && $token && $user['role'] === 'admin') {
            return $this->redirectToRoute('admin_dashboard');
        }
        
        // Otherwise redirect to login
        return $this->redirectToRoute('login');
    }

    #[Route('/login', name: 'login')]
    public function login(Request $request, SessionInterface $session): Response
    {
        // Check if user is authenticated and is admin
        $user = $session->get('admin_user');
        $token = $session->get('api_token');
        
        if ($user && $token && $user['role'] === 'admin') {
            return $this->redirectToRoute('admin_dashboard');
        }

        if ($request->isMethod('POST')) {
            $email = $request->request->get('email');
            $password = $request->request->get('password');

            if (empty($email) || empty($password)) {
                $this->addFlash('error', 'Please enter both email and password');
                return $this->render('security/login.html.twig');
            }

            try {
                $authData = $this->apiClient->authenticate($email, $password);

                if (isset($authData['user']) && $authData['user']['role'] === 'admin') {
                    // Store user data and token in session
                    $session->set('admin_user', $authData['user']);
                    $session->set('api_token', $authData['token']);

                    $userName = $authData['user']['username'] ?? 'Admin';
                    $this->addFlash('success', 'Welcome back, ' . $userName . '!');
                    
                    return $this->redirectToRoute('admin_dashboard');
                } else {
                    $this->addFlash('error', 'Admin access required. Please contact your administrator.');
                }
            } catch (\Exception $e) {
                $this->addFlash('error', 'Invalid credentials. Please try again.');
            }
        }

        return $this->render('security/login.html.twig');
    }

    #[Route('/logout', name: 'logout')]
    public function logout(SessionInterface $session): Response
    {
        // Clear session data
        $session->remove('admin_user');
        $session->remove('api_token');
        $session->invalidate();

        $this->addFlash('success', 'You have been logged out successfully');
        return $this->redirectToRoute('login');
    }
}
