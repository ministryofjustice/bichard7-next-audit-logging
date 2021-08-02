# Translate Event

A lambda that applies translation logic to a given raw message to produce an [Audit Log Event](../../../shared/src/types/AuditLogEvent.ts).

## Translators

This lambda uses a [Factory Pattern](<https://en.wikipedia.org/wiki/Factory_(object-oriented_programming)>) to determine the translation logic to apply to the message, which allows it to handle many different formats. A [Message Format](../../../shared/src/types/MessageFormat.ts) is specified on the given message, which is then used to determine the logic to apply.
