import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import Select from '@/components/Select';
import { cancelReasonOptions } from '@/core/appointments';

export default function CancelSchedulingModal({
  open,
  onClose,
  handleSubmit,
  onCancel,
  cancelErrors,
  cancelRegister,
  cancelSubmitting,
  t
}: {
  open: boolean;
  onClose: () => void;
  handleSubmit: any;
  onCancel: any;
  cancelErrors: any;
  cancelRegister: any;
  cancelSubmitting: boolean;
  t: (key: string) => string;
}) {
  return (
    <Modal open={open} title={t('scheduling.cancelTitle')} onClose={onClose}>
      <form onSubmit={handleSubmit(onCancel)} className="space-y-4" noValidate>
        <Select label={t('scheduling.cancelReason')} error={cancelErrors.reason?.message} {...cancelRegister('reason')}>
          <option value="">{t('common.select')}</option>
          {cancelReasonOptions.map((option) => (
            <option key={option} value={option}>
              {t(`scheduling.cancelReasons.${option}`)}
            </option>
          ))}
        </Select>
        <Input label={t('scheduling.cancelNote')} error={cancelErrors.note?.message} {...cancelRegister('note')} />
        <Button type="submit" className="w-full" disabled={cancelSubmitting}>
          {cancelSubmitting ? t('scheduling.cancelling') : t('scheduling.confirmCancel')}
        </Button>
      </form>
    </Modal>
  );
}
