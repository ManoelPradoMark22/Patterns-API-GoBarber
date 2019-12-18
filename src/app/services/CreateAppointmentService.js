import { startOfHour, parseISO, isBefore, format } from 'date-fns';
import pt from 'date-fns/locale/pt';

import User from '../models/User';
import Appointment from '../models/Appointment';

import Notification from '../schemas/Notification';

class CreateAppointmentService {
  /* o único método q teremos aqui é o run, poderíamos ter um constructor acima
  para inicializar alguma variável, mas nesse caso não precisa.
  Obs.: o nosso service jamais poderá ter acesso ao objeto req (requisicao do
  express) nem ao objeto res (resposta).
  !Lembre-se q no final do service tem que retornar algo, nesse caso é o appointment
  !!O service não retorna uma resposta, entao ao inves de dar, por exemplo, um:
  -> return res
        .status(401)
        .json({ error: 'You can only create appointments with providers' });
  O service na verdade dispara um erro caso seja necessario!, como por exemplo:
  -> throw new Error('You can only create appointments with providers') */

  // vamos passar como um objeto para podermos alterar os nomes ao receber no controller
  async run({ provider_id, user_id, date }) {
    // **check if provider_id is a provider:
    const checkIsProvider = await User.findOne({
      where: {
        id: provider_id,
        provider: true,
      },
    });

    if (!checkIsProvider) {
      throw new Error('You can only create appointments with providers');
    }

    // **check for past dates
    /* o parseISO trasforma a string date passada pelo body em um objeto date
    que pode ser utilizado dentro do método startOfHour que por sua vez
    vai ZERAR os minutos e segundos, pq queremos APENAS a HORA! Já que os
    agendamentos só poderão ser feitos de hora em hora */
    const hourStart = startOfHour(parseISO(date));

    /* verificando se hourStart está antes da Data atual! */
    if (isBefore(hourStart, new Date())) {
      throw new Error('Past dates are not permitted');
    }

    //* *check date availability */
    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAvailability) {
      throw new Error('Appointment date is not available');
    }

    const appointment = await Appointment.create({
      user_id,
      provider_id, // esse ta pegando do req.body
      date, // esse ta pegando do req.body
    });

    const user = await User.findByPk(user_id);
    const formattedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', às' H:mm'h'",
      { locale: pt }
    );
    // exemplo: ...dia 31 de agosto, às 09:30h

    // Notify appointment provider
    await Notification.create({
      content: `Novo agendamento de ${user.name} para o ${formattedDate}`,
      user: provider_id,
    });

    return appointment; /* retorno do service */
  }
}

export default new CreateAppointmentService();
