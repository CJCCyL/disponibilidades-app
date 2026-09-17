import { useEffect, useState } from "react";
import { Card, Button, TextInput, Title, Textarea, Text, Select } from "@mantine/core";
import { adminAPI } from "../api/adminApi.js";
import { useNavigate } from "react-router-dom";

function contarVotos(answers = []) {
  const unique = new Map();

  for (const a of answers) {
    if (!unique.has(a.user_id)) {
      unique.set(a.user_id, a.answer);
    }
  }

  let si = 0, no = 0, ninguna = 0;

  for (const v of unique.values()) {
    if (v === "yes" || v === "si") si++;
    else if (v === "no") no++;
    else if (v === "ninguna") ninguna++;
  }

  return { si, no, ninguna };
}

const TIPO_LABELS = {
  informativo: "Informativo",
  participativo: "Participativo",
  disponibilidad: "Disponibilidad",
};

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [eventType, setEventType] = useState("participativo");
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await adminAPI.listEvents();
        if (!cancelled) setEvents(data);
      } catch (e) {
        console.error("Error cargando eventos", e);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  async function reload() {
    try {
      const data = await adminAPI.listEvents();
      setEvents(data);
    } catch (e) {
      console.error("Error recargando eventos", e);
    }
  }

  async function createEvent() {
    if (!title || !date) return;

    try {
      await adminAPI.createEvent({
        title,
        description: description || null,
        date,
        start_time: null,
        end_time: null,
        event_type: eventType,
      });

      setTitle("");
      setDescription("");
      setDate("");
      setEventType("participativo");
      await reload();
    } catch (e) {
      console.error("Error creando evento", e);
      alert("Error creando evento");
    }
  }

  async function deleteEvent(id) {
    try {
      await adminAPI.deleteEvent(id);
      await reload();
    } catch (e) {
      console.error("Error eliminando evento", e);
      alert("Error eliminando evento");
    }
  }

  return (
    <>
      <Title order={3} mb="md">Crear evento</Title>

      <Card shadow="sm" p="md" mb="xl">
        <TextInput
          label="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          mb="sm"
        />
        <Textarea
          label="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          mb="sm"
        />
        <TextInput
          type="date"
          label="Fecha"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          mb="sm"
        />
        <Select
          label="Tipo de evento"
          value={eventType}
          onChange={setEventType}
          data={[
            { value: "informativo",   label: "Informativo (sin votación)" },
            { value: "participativo", label: "Participativo (Sí / No)" },
            { value: "disponibilidad", label: "Disponibilidad (Sí / Ninguna)" },
          ]}
          mb="sm"
        />

        <Button onClick={createEvent}>Crear evento</Button>
      </Card>

      <Title order={3} mb="md">Eventos existentes</Title>

      {events.length === 0 && (
        <Text size="sm" c="dimmed">No hay eventos.</Text>
      )}

      {events.map((ev) => {
        const tipo = ev.event_type || "participativo";
        const { si, no, ninguna } = contarVotos(ev.answers);

        return (
          <Card key={ev.id} shadow="sm" p="md" mb="md">
            <b>{ev.title}</b> — {ev.date}
            <Text size="xs" c="dimmed">
              Tipo: {TIPO_LABELS[tipo] ?? tipo}
            </Text>
            {ev.description && <p>{ev.description}</p>}

            {/* Resumen de votos según tipo */}
            {ev.answers && ev.answers.length > 0 && tipo !== "informativo" && (
              <div style={{ marginTop: "10px" }}>
                <b>Resumen de votos:</b>
                <div>Sí: {si}</div>
                {tipo === "disponibilidad" ? (
                  <div>Ninguna: {ninguna}</div>
                ) : (
                  <div>No: {no}</div>
                )}
              </div>
            )}

            <Button mt="sm" onClick={() => navigate(`/admin/event/${ev.id}`)}>
              Ver respuestas
            </Button>

            <Button mt="sm" ml="sm" color="red" onClick={() => deleteEvent(ev.id)}>
              Eliminar
            </Button>
          </Card>
        );
      })}
    </>
  );
}
