import React from 'react';
import { deleteUserById } from '../../server/services/userService';
import toast from 'react-hot-toast';

/**
 * Componente DeleteUserButton
 * Este componente renderiza un botón que permite eliminar un usuario de la base de datos.
 * Solo debe ser usado por administradores.
 * @param {string} userId - El ID del usuario a eliminar.
 * @param {function} onDelete - Función opcional que se ejecuta después de eliminar el usuario.
 */
function DeleteUserButton({ userId, onDelete }) {
  /**
   * Función que maneja la eliminación del usuario.
   * Muestra una confirmación antes de proceder.
   */
  const handleDelete = async () => {
    // Confirmación antes de eliminar
    const confirmDelete = window.confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.');
    if (!confirmDelete) return;

    try {
      // Llamar a la función del servicio para eliminar el usuario
      await deleteUserById(userId);
      // Mostrar mensaje de éxito
      toast.success('Usuario eliminado exitosamente.');
      // Ejecutar callback opcional
      if (onDelete) onDelete(userId);
    } catch (error) {
      // Mostrar mensaje de error
      toast.error('Error al eliminar el usuario: ' + error.message);
      console.error('Error deleting user:', error);
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      title="Eliminar usuario"
    >
      Eliminar Usuario
    </button>
  );
}

export default DeleteUserButton;