FROM node:22 as frontend

WORKDIR /usr/local/app

COPY ./frontend /usr/local/app/

RUN npm install

RUN npm run build

FROM eclipse-temurin:17-jdk-jammy AS backend
ENV HOME=/usr/app
RUN mkdir -p $HOME
WORKDIR $HOME
COPY ./backend $HOME
COPY --from=frontend /usr/local/app/dist/frontend $HOME/src/main/resources/META-INF/resources/
RUN ./mvnw -f $HOME/pom.xml clean package

FROM registry.access.redhat.com/ubi8/ubi-minimal:8.3

ARG JAVA_PACKAGE=java-17-openjdk-headless
ARG RUN_JAVA_VERSION=1.3.8
ENV LANG='en_US.UTF-8' LANGUAGE='en_US:en'

RUN microdnf install curl fontconfig ca-certificates ${JAVA_PACKAGE} \
    && microdnf update \
    && microdnf clean all \
    && mkdir /deployments \
    && chown 1000 /deployments \
    && chmod "g+rwX" /deployments \
    && chown 1000:root /deployments \
    && curl https://repo1.maven.org/maven2/io/fabric8/run-java-sh/${RUN_JAVA_VERSION}/run-java-sh-${RUN_JAVA_VERSION}-sh.sh -o /deployments/run-java.sh \
    && chown 1000 /deployments/run-java.sh \
    && chmod 540 /deployments/run-java.sh \
    && echo "securerandom.source=file:/dev/urandom" >> /etc/alternatives/jre/lib/security/java.security

ENV JAVA_OPTIONS="-Dquarkus.http.host=0.0.0.0 -Djava.util.logging.manager=org.jboss.logmanager.LogManager"
ENV TPVIS_WORKSPACE_PATH="/workspaces"
# We make four distinct layers so if there are application changes the library layers can be re-used
COPY --chown=1000 --from=backend /usr/app/target/quarkus-app/lib/ /deployments/lib/
COPY --chown=1000 --from=backend /usr/app/target/quarkus-app/*.jar /deployments/
COPY --chown=1000 --from=backend /usr/app/target/quarkus-app/app/ /deployments/app/
COPY --chown=1000 --from=backend /usr/app/target/quarkus-app/quarkus/ /deployments/quarkus/
VOLUME /workspaces

EXPOSE 8080
USER 1000

ENTRYPOINT [ "/deployments/run-java.sh" ]
