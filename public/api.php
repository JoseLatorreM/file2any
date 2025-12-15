<?php
// api.php - Puente de Base de Datos para Hostinger (Sin Node.js)
// Este archivo permite que tu React se conecte a MySQL en servidores compartidos.

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Manejar solicitudes OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- CONFIGURACIÓN DE LA BASE DE DATOS ---
$host = "localhost";
$user = "u961483530_Shin";
$password = "qE~#ppl4";
$dbname = "u961483530_Comentarios";

// Conexión
$conn = new mysqli($host, $user, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["error" => "Error de conexión a la BD: " . $conn->connect_error]));
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$id = $_GET['id'] ?? 0;

// --- RUTAS ---

if ($method === 'GET') {
    // LISTAR COMENTARIOS
    $sql = "SELECT * FROM suggestions ORDER BY created_at DESC LIMIT 50";
    $result = $conn->query($sql);
    $rows = [];
    if ($result) {
        while($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }
    }
    echo json_encode($rows);

} elseif ($method === 'POST') {
    
    if ($action === 'like' && $id > 0) {
        // DAR LIKE
        $stmt = $conn->prepare("UPDATE suggestions SET likes = likes + 1 WHERE id = ?");
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(["error" => "Error DB (posiblemente falta columna likes): " . $conn->error]);
            exit;
        }
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode(["message" => "Like agregado"]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Error al dar like"]);
        }
        $stmt->close();

    } else {
        // CREAR COMENTARIO
        $input = json_decode(file_get_contents('php://input'), true);
        
        $username = $input['username'] ?? '';
        $tool_name = $input['tool_name'] ?? 'General';
        $comment = $input['comment'] ?? '';

        // Validaciones de seguridad
        if (empty($username) || empty($comment)) {
            http_response_code(400);
            echo json_encode(["error" => "Faltan campos"]);
            exit;
        }
        if (strlen($username) > 50 || strlen($comment) > 500) {
            http_response_code(400);
            echo json_encode(["error" => "Texto demasiado largo"]);
            exit;
        }

        $stmt = $conn->prepare("INSERT INTO suggestions (username, tool_name, comment) VALUES (?, ?, ?)");
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(["error" => "Error DB: " . $conn->error]);
            exit;
        }
        $stmt->bind_param("sss", $username, $tool_name, $comment);
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(["id" => $stmt->insert_id, "message" => "Comentario guardado"]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Error al guardar"]);
        }
        $stmt->close();
    }
}

$conn->close();
?>